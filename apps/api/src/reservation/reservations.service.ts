import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

import { CreateReservationRequestDto } from './dto/create-reservation-request.dto';

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
          WHERE
            s."id" IN (${Prisma.join(dto.slabIds)})
            AND s."deletedAt" IS NULL
            AND si."shareId" = ${share.id}
            AND sh."companyId" = ${share.companyId}
          FOR UPDATE
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
                        message: dto.message,

                        status: 'PENDING',

                        items: {
                            create: dto.slabIds.map((slabId) => ({
                                slabId,
                            })),
                        },
                    },

                    include: {
                        items: {
                            include: {
                                slab: true,
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
            return tx.reservationRequest.findUnique({
                where: {
                    id: reservationRequest.id,
                },
                include: {
                    items: {
                        include: {
                            slab: true,
                        },
                    },
                },
            });
        });
    }
}