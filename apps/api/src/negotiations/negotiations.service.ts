import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { Prisma } from '../../generated/prisma/client';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { CreateNegotiationDto } from './dto/create-negotiation.dto';
import { UpdateNegotiationDto } from './dto/update-negotiation.dto';

export type NegotiationUploadFile = {
    originalname: string;
    buffer: Buffer;
    mimetype: string;
    size: number;
};

@Injectable()
export class NegotiationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
    ) { }

    async findAll(user: AuthenticatedUser) {
        const companyId = this.getCompanyId(user);

        return this.prisma.negotiation.findMany({
            where: {
                reservationRequest: {
                    companyId,
                },
            },

            orderBy: {
                createdAt: 'desc',
            },

            include: {
                reservationRequest: {
                    select: {
                        id: true,
                        status: true,
                        message: true,
                        createdAt: true,

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
                                        bundleId: true,

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
                },
            },
        });
    }

    async findOne(
        id: number,
        user: AuthenticatedUser,
    ) {
        const companyId = this.getCompanyId(user);

        const negotiation =
            await this.prisma.negotiation.findFirst({
                where: {
                    id,

                    reservationRequest: {
                        companyId,
                    },
                },

                include: {
                    reservationRequest: {
                        select: {
                            id: true,
                            status: true,
                            message: true,
                            createdAt: true,

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
                                            bundleId: true,

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
                    },

                    files: true,
                },
            });

        if (!negotiation) {
            throw new NotFoundException(
                'Negociação não encontrada.',
            );
        }

        return {
            ...negotiation,
            files: await Promise.all(negotiation.files.map(async (file) => ({
                ...file,
                url: await this.storageService.getPresignedUrl(file.storageKey),
            }))),
        };
    }

    async uploadFile(
        id: number,
        file: NegotiationUploadFile,
        user: AuthenticatedUser,
    ) {
        const companyId = this.getCompanyId(user);
        if (!file) {
            throw new BadRequestException('Selecione um arquivo para anexar.');
        }

        const negotiation = await this.prisma.negotiation.findFirst({
            where: {
                id,
                reservationRequest: { companyId },
            },
            select: { id: true },
        });
        if (!negotiation) {
            throw new NotFoundException('Negociação não encontrada.');
        }

        const extension = file.originalname.includes('.')
            ? file.originalname.substring(file.originalname.lastIndexOf('.'))
            : '';
        const storageKey = `negotiations/${id}/${randomUUID()}${extension}`;

        await this.storageService.upload(storageKey, file.buffer, file.mimetype);
        try {
            const savedFile = await this.prisma.negotiationFile.create({
                data: {
                    negotiationId: id,
                    fileName: file.originalname,
                    storageKey,
                    contentType: file.mimetype,
                    size: file.size,
                },
            });

            return {
                ...savedFile,
                url: await this.storageService.getPresignedUrl(storageKey),
            };
        } catch (error) {
            await this.storageService.delete(storageKey).catch(() => undefined);
            throw error;
        }
    }

    async create(
        dto: CreateNegotiationDto,
        user: AuthenticatedUser,
    ) {
        const companyId = this.getCompanyId(user);

        const reservation =
            await this.prisma.reservationRequest.findFirst({
                where: {
                    id: dto.reservationRequestId,
                    companyId,
                },
                select: {
                    id: true,
                    status: true,
                    negotiation: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

        if (!reservation) {
            throw new NotFoundException(
                'Solicitação de reserva não encontrada.',
            );
        }

        if (reservation.status !== 'APPROVED') {
            throw new ConflictException(
                'Somente solicitações de reserva aprovadas podem iniciar uma negociação.',
            );
        }

        if (reservation.negotiation) {
            throw new ConflictException(
                'Esta solicitação de reserva já possui uma negociação.',
            );
        }

        return this.prisma.negotiation.create({
            data: {
                reservationRequestId:
                    reservation.id,

                status: 'IN_NEGOTIATION',

                paymentTerms:
                    dto.paymentTerms?.trim() || null,

                portOfLoading:
                    dto.portOfLoading?.trim() || null,

                portOfDestination:
                    dto.portOfDestination?.trim() || null,

                shippingMethod:
                    dto.shippingMethod?.trim() || null,

                incoterm:
                    dto.incoterm?.trim() || null,

                containerType:
                    dto.containerType?.trim() || null,

                deliveryTime:
                    dto.deliveryTime?.trim() || null,

                truckingFee:
                    dto.truckingFee ?? null,

                oceanFreight:
                    dto.oceanFreight ?? null,

                invoice:
                    dto.invoice?.trim() || null,

                packingInfo:
                    dto.packingInfo?.trim() || null,

                remarks:
                    dto.remarks?.trim() || null,
            },
        });
    }

    private getCompanyId(
        user: AuthenticatedUser,
    ): number {
        if (!user.companyId) {
            throw new ForbiddenException(
                'Usuário não possui uma empresa ativa.',
            );
        }

        return user.companyId;
    }

    async update(
        id: number,
        dto: UpdateNegotiationDto,
        user: AuthenticatedUser,
    ) {
        const companyId = this.getCompanyId(user);

        const negotiation = await this.prisma.negotiation.findFirst({
            where: {
                id,
                reservationRequest: {
                    companyId,
                },
            },
        });

        if (!negotiation) {
            throw new NotFoundException(
                'Negociação não encontrada.',
            );
        }

        if (negotiation.status !== 'IN_NEGOTIATION') {
            throw new ConflictException(
                'Esta negociação não está mais aberta para edição.',
            );
        }

        const updatedNegotiation = await this.prisma.negotiation.update({
            where: {
                id,
            },
            data: {
                ...(dto.paymentTerms !== undefined && {
                    paymentTerms: dto.paymentTerms.trim() || null,
                }),

                ...(dto.portOfLoading !== undefined && {
                    portOfLoading: dto.portOfLoading.trim() || null,
                }),

                ...(dto.portOfDestination !== undefined && {
                    portOfDestination: dto.portOfDestination.trim() || null,
                }),

                ...(dto.shippingMethod !== undefined && {
                    shippingMethod: dto.shippingMethod.trim() || null,
                }),

                ...(dto.incoterm !== undefined && {
                    incoterm: dto.incoterm.trim() || null,
                }),

                ...(dto.containerType !== undefined && {
                    containerType: dto.containerType.trim() || null,
                }),

                ...(dto.deliveryTime !== undefined && {
                    deliveryTime: dto.deliveryTime.trim() || null,
                }),

                ...(dto.truckingFee !== undefined && {
                    truckingFee: dto.truckingFee,
                }),

                ...(dto.oceanFreight !== undefined && {
                    oceanFreight: dto.oceanFreight,
                }),

                ...(dto.invoice !== undefined && {
                    invoice: dto.invoice.trim() || null,
                }),

                ...(dto.packingInfo !== undefined && {
                    packingInfo: dto.packingInfo.trim() || null,
                }),

                ...(dto.remarks !== undefined && {
                    remarks: dto.remarks.trim() || null,
                }),
            },
        });

        const isComplete =
            this.isNegotiationComplete(updatedNegotiation);

        if (isComplete) {
            return this.prisma.negotiation.update({
                where: {
                    id,
                },
                data: {
                    status: 'AWAITING_BOOKING',
                },
            });
        }

        return updatedNegotiation;
    }

    private isNegotiationComplete(negotiation: {
        paymentTerms: string | null;
        portOfLoading: string | null;
        portOfDestination: string | null;
        shippingMethod: string | null;
        incoterm: string | null;
        containerType: string | null;
        deliveryTime: string | null;
        truckingFee: Prisma.Decimal | null;
        oceanFreight: Prisma.Decimal | null;
    }) {
        return (
            !!negotiation.paymentTerms?.trim() &&
            !!negotiation.portOfLoading?.trim() &&
            !!negotiation.portOfDestination?.trim() &&
            !!negotiation.shippingMethod?.trim() &&
            !!negotiation.incoterm?.trim() &&
            !!negotiation.containerType?.trim() &&
            !!negotiation.deliveryTime?.trim() &&
            negotiation.truckingFee !== null &&
            negotiation.oceanFreight !== null
        );
    }
}