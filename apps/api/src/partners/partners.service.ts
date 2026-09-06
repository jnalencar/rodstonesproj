import {
    ConflictException,
    Injectable,
    NotFoundException,
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
        const company = await this.prisma.company.findFirst({
            where: {
                id: dto.companyId,
                status: 'ACTIVE',
                deletedAt: null,
            },
        });

        if (!company) {
            throw new NotFoundException(
                'Empresa não encontrada ou está inativa',
            );
        }

        const existingCompany = await this.prisma.partner.findFirst({
            where: {
                companyId: dto.companyId,
                deletedAt: null,
            },
        });

        if (existingCompany) {
            throw new ConflictException(
                'Empresa já possui um representante comercial',
            );
        }

        if (dto.email) {
            const existingPartner = await this.prisma.partner.findFirst({
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
                name: company.name,
                companyId: company.id,
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