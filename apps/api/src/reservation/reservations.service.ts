import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

import { CreateReservationRequestDto } from './dto/create-reservation-request.dto';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';

@Injectable()
export class ReservationsService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async create(
        token: string,
        dto: CreateReservationRequestDto,
    ) {
        return this.prisma.$transaction(async (tx) => {
            /*
             * 1. Busca o Share
             */
            const share = await tx.share.findFirst({
                where: {
                    token,
                    deletedAt: null,
                    status: 'ACTIVE',
                },
                select: {
                    id: true,
                    companyId: true,
                    expiresAt: true,
                    clientId: true,
                },
            });

            if (!share) {
                throw new NotFoundException(
                    'Catálogo não encontrado ou inativo',
                );
            }

            /*
             * 2. Verifica expiração
             */
            if (share.expiresAt && share.expiresAt <= new Date()) {
                throw new BadRequestException(
                    'Este catálogo expirou',
                );
            }

            /*
             * 3. Bloqueia as slabs selecionadas
             *
             * FOR UPDATE impede que outra transação altere
             * essas mesmas linhas enquanto esta transação
             * estiver em andamento.
             */
            const slabs = await tx.$queryRaw<
                Array<{
                    id: number;
                    bundleId: number;
                    status: string;
                }>
            >(
                Prisma.sql`
                    SELECT
                    s."id",
                    s."bundleId",
                    s."status"
                    FROM "Slab" s
                    INNER JOIN "ShareItem" si
                    ON si."bundleId" = s."bundleId"
                    INNER JOIN "Share" sh
                    ON sh."id" = si."shareId"
                    INNER JOIN "Bundle" b
                    ON b."id" = s."bundleId"
                    WHERE
                    s."id" IN (${Prisma.join(dto.slabIds)})
                    AND s."deletedAt" IS NULL
                    AND b."deletedAt" IS NULL
                    AND b."status" <> 'INACTIVE'
                    AND si."shareId" = ${share.id}
                    AND sh."companyId" = ${share.companyId}
                    FOR UPDATE OF s
                `,
            );

            /*
             * 4. Verifica se todas as slabs foram encontradas
             */
            if (slabs.length !== dto.slabIds.length) {
                throw new BadRequestException(
                    'Uma ou mais chapas não pertencem a este catálogo',
                );
            }

            /*
             * 5. Verifica disponibilidade
             */
            const unavailableSlabs = slabs.filter(
                (slab) => slab.status !== 'AVAILABLE',
            );

            if (unavailableSlabs.length > 0) {
                throw new ConflictException(
                    'Uma ou mais chapas selecionadas não estão mais disponíveis',
                );
            }

            /*
             * 6. Cria a solicitação
             */
            const reservationRequest =
                await tx.reservationRequest.create({
                    data: {
                        companyId: share.companyId,
                        shareId: share.id,
                        message: dto.message?.trim() || null,
                        status: 'PENDING',

                        items: {
                            create: dto.slabIds.map((slabId) => ({
                                slabId,
                            })),
                        },
                    },

                    select: {
                        id: true,
                        status: true,
                        message: true,
                        createdAt: true,

                        items: {
                            select: {
                                slabId: true,
                                slab: {
                                    select: {
                                        id: true,
                                        number: true,
                                        status: true,
                                        bundleId: true,
                                    },
                                },
                            },
                        },
                    },
                });

            /*
             * 7. Altera as chapas para RESERVED
             */
            await tx.slab.updateMany({
                where: {
                    id: {
                        in: dto.slabIds,
                    },
                },
                data: {
                    status: 'RESERVED',
                },
            });

            /*
             * 8. Retorna a solicitação
             */
            return reservationRequest;
        });
    }

    async findAll(user: AuthenticatedUser) {
        const companyId = this.getCompanyId(user);

        const reservations =
            await this.prisma.reservationRequest.findMany({
                where: {
                    companyId,
                },

                orderBy: {
                    createdAt: 'desc',
                },

                include: {
                    share: {
                        select: {
                            id: true,
                            title: true,
                            createdBy: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                            client: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    phone: true,
                                },
                            },
                        },
                    },

                    items: {
                        include: {
                            slab: {
                                select: {
                                    id: true,
                                    number: true,
                                    status: true,
                                    bundle: {
                                        select: {
                                            id: true,
                                            bundleCode: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

        return reservations;
    }

    async findOne(
        id: number,
        user: AuthenticatedUser,
    ) {
        const companyId = this.getCompanyId(user);

        const reservation =
            await this.prisma.reservationRequest.findFirst({
                where: {
                    id,
                    companyId,
                },

                include: {
                    share: {
                        select: {
                            id: true,
                            title: true,
                            token: true,
                            createdBy: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                            client: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    phone: true,
                                    document: true,
                                },
                            },
                        },
                    },

                    items: {
                        include: {
                            slab: {
                                include: {
                                    bundle: {
                                        select: {
                                            id: true,
                                            bundleCode: true,
                                            material: true,
                                            finish: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

        if (!reservation) {
            throw new NotFoundException(
                'Solicitação de reserva não encontrada.',
            );
        }

        return reservation;
    }

    private getCompanyId(
        user: AuthenticatedUser,
    ): number {
        if (!user.companyId) {
            throw new ForbiddenException(
                'Usuário não possui empresa ativa.',
            );
        }

        return user.companyId;
    }

    async approve(
        id: number,
        user: AuthenticatedUser,
    ) {
        const companyId = user.companyId;

        if (!companyId) {
            throw new ForbiddenException(
                'Usuário não possui uma empresa associada.',
            );
        }

        return this.prisma.$transaction(async (tx) => {
            // 1. Bloqueia a solicitação durante a transação.
            const locked = await tx.$queryRaw<{ id: number }[]>`
      SELECT "id"
      FROM "ReservationRequest"
      WHERE "id" = ${id}
        AND "companyId" = ${companyId}
      FOR UPDATE
    `;

            if (locked.length === 0) {
                throw new NotFoundException(
                    'Solicitação de reserva não encontrada.',
                );
            }

            // 2. Busca a solicitação e suas chapas.
            const reservation =
                await tx.reservationRequest.findFirst({
                    where: {
                        id,
                        companyId,
                    },
                    include: {
                        share: {
                            select: {
                                id: true,
                                title: true,
                                client: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        phone: true,
                                    },
                                },
                            },
                        },
                        items: {
                            include: {
                                slab: {
                                    select: {
                                        id: true,
                                        number: true,
                                        status: true,
                                        deletedAt: true,
                                        bundleId: true,
                                    },
                                },
                            },
                        },
                    },
                });

            if (!reservation) {
                throw new NotFoundException(
                    'Solicitação de reserva não encontrada.',
                );
            }

            // 3. Só solicitações pendentes podem ser aprovadas.
            if (reservation.status !== 'PENDING') {
                throw new ConflictException(
                    'Somente solicitações pendentes podem ser aprovadas.',
                );
            }

            if (reservation.items.length === 0) {
                throw new ConflictException(
                    'A solicitação não possui chapas.',
                );
            }

            // 4. Confirma que todas as chapas continuam reservadas.
            const invalidSlabs = reservation.items.filter(
                (item) =>
                    item.slab.status !== 'RESERVED' ||
                    item.slab.deletedAt !== null,
            );

            if (invalidSlabs.length > 0) {
                throw new ConflictException(
                    'Uma ou mais chapas não estão mais reservadas.',
                );
            }

            // 5. Atualiza o status da solicitação.
            await tx.reservationRequest.update({
                where: {
                    id: reservation.id,
                },
                data: {
                    status: 'APPROVED',
                },
            });

            // 6. Retorna os dados atualizados.
            return tx.reservationRequest.findUnique({
                where: {
                    id: reservation.id,
                },
                include: {
                    share: {
                        select: {
                            id: true,
                            title: true,
                            client: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    phone: true,
                                },
                            },
                        },
                    },
                    items: {
                        include: {
                            slab: {
                                select: {
                                    id: true,
                                    number: true,
                                    status: true,
                                    bundleId: true,
                                },
                            },
                        },
                    },
                },
            });
        });
    }

    async reject(
        id: number,
        user: AuthenticatedUser,
    ) {
        const companyId = user.companyId;

        if (!companyId) {
            throw new ForbiddenException(
                'Usuário não possui uma empresa associada.',
            );
        }

        return this.prisma.$transaction(async (tx) => {
            // 1. Bloqueia a solicitação e restringe pela empresa.
            const locked = await tx.$queryRaw<{ id: number }[]>`
      SELECT "id"
      FROM "ReservationRequest"
      WHERE "id" = ${id}
        AND "companyId" = ${companyId}
      FOR UPDATE
    `;

            if (locked.length === 0) {
                throw new NotFoundException(
                    'Solicitação de reserva não encontrada.',
                );
            }

            // 2. Busca a solicitação e as chapas associadas.
            const reservation =
                await tx.reservationRequest.findFirst({
                    where: {
                        id,
                        companyId,
                    },
                    include: {
                        share: {
                            select: {
                                id: true,
                                title: true,
                                client: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        phone: true,
                                    },
                                },
                            },
                        },
                        items: {
                            select: {
                                slabId: true,
                                slab: {
                                    select: {
                                        id: true,
                                        number: true,
                                        status: true,
                                        deletedAt: true,
                                    },
                                },
                            },
                        },
                    },
                });

            if (!reservation) {
                throw new NotFoundException(
                    'Solicitação de reserva não encontrada.',
                );
            }

            // 3. Só solicitações pendentes podem ser rejeitadas.
            if (reservation.status !== 'PENDING') {
                throw new ConflictException(
                    'Somente solicitações pendentes podem ser rejeitadas.',
                );
            }

            if (reservation.items.length === 0) {
                throw new ConflictException(
                    'A solicitação não possui chapas.',
                );
            }

            const slabIds = reservation.items.map(
                (item) => item.slabId,
            );

            // 4. Bloqueia as chapas para evitar alterações
            // concorrentes durante a verificação e liberação.
            const lockedSlabs = await tx.$queryRaw<
                { id: number }[]
            >`
      SELECT "id"
      FROM "Slab"
      WHERE "id" IN (${Prisma.join(slabIds)})
      ORDER BY "id"
      FOR UPDATE
    `;

            if (lockedSlabs.length !== slabIds.length) {
                throw new ConflictException(
                    'Uma ou mais chapas não foram encontradas.',
                );
            }

            // 5. Identifica chapas vinculadas a outras
            // solicitações que ainda estão ativas.
            const otherActiveItems =
                await tx.reservationRequestItem.findMany({
                    where: {
                        slabId: {
                            in: slabIds,
                        },
                        reservationRequestId: {
                            not: reservation.id,
                        },
                        reservationRequest: {
                            status: {
                                in: ['PENDING', 'APPROVED'],
                            },
                        },
                    },
                    select: {
                        slabId: true,
                    },
                });

            const slabsWithOtherReservations = new Set(
                otherActiveItems.map((item) => item.slabId),
            );

            // 6. Só libera chapas que continuam reservadas
            // e que não possuem outra solicitação ativa.
            const slabsToRelease = reservation.items
                .filter(
                    (item) =>
                        item.slab.status === 'RESERVED' &&
                        item.slab.deletedAt === null &&
                        !slabsWithOtherReservations.has(item.slabId),
                )
                .map((item) => item.slabId);

            // 7. Atualiza a solicitação para REJECTED.
            await tx.reservationRequest.update({
                where: {
                    id: reservation.id,
                },
                data: {
                    status: 'REJECTED',
                },
            });

            // 8. Libera somente as chapas elegíveis.
            if (slabsToRelease.length > 0) {
                await tx.slab.updateMany({
                    where: {
                        id: {
                            in: slabsToRelease,
                        },
                        status: 'RESERVED',
                        deletedAt: null,
                    },
                    data: {
                        status: 'AVAILABLE',
                    },
                });
            }

            // 9. Retorna a solicitação atualizada.
            return tx.reservationRequest.findUnique({
                where: {
                    id: reservation.id,
                },
                include: {
                    share: {
                        select: {
                            id: true,
                            title: true,
                            client: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    phone: true,
                                },
                            },
                        },
                    },
                    items: {
                        include: {
                            slab: {
                                select: {
                                    id: true,
                                    number: true,
                                    status: true,
                                    bundleId: true,
                                },
                            },
                        },
                    },
                },
            });
        });
    }
}