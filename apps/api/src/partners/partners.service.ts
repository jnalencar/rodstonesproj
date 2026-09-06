import {
    ConflictException,
    Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { PartnerType } from '@prisma/client';

@Injectable()
export class PartnersService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async create(dto: CreatePartnerDto) {
        if (dto.email) {
            const existingPartner =
                await this.prisma.partner.findFirst({
                    where: {
                        email: dto.email,
                        deletedAt: null,
                    },
                });

            if (existingPartner) {
                throw new ConflictException(
                    'Já existe um parceiro com este e-mail',
                );
            }
        }

        return this.prisma.partner.create({
            data: {
                name: dto.name,
                type: dto.type as PartnerType,
                email: dto.email,
                phone: dto.phone,
            },
        });
    }

    async findAll() {
        return this.prisma.partner.findMany({
            where: {
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                type: true,
                email: true,
                phone: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                companies: {
                    select: {
                        company: {
                            select: {
                                id: true,
                                name: true,
                                status: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
}