import {
    ConflictException,
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Injectable()
export class PartnersService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async create(dto: CreatePartnerDto) {
        if (dto.companyId) {
            const company = await this.prisma.company.findFirst({
                where: {
                    id: dto.companyId,
                    status: 'ACTIVE',
                    deletedAt: null,
                },
                select: {
                    id: true,
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
                name: dto.name,
                companyId: dto.companyId,
                type: dto.type,
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

    async findAllByCompany(user: AuthenticatedUser) {
  if (!user.companyId) {
    throw new BadRequestException(
      'Nenhuma empresa selecionada',
    );
  }

  return this.prisma.partner.findMany({
    where: {
      deletedAt: null,
      status: 'ACTIVE',
      companies: {
        some: {
          companyId: user.companyId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      type: true,
      email: true,
      phone: true,
      status: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
}