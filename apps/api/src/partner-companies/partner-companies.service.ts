import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerCompanyDto } from './dto/create-partner-company.dto';

@Injectable()
export class PartnerCompaniesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreatePartnerCompanyDto) {
    const partner = await this.prisma.partner.findFirst({
      where: {
        id: dto.partnerId,
        deletedAt: null,
      },
    });

    if (!partner) {
      throw new NotFoundException(
        'Parceiro não encontrado',
      );
    }

    if (partner.status !== 'ACTIVE') {
      throw new ConflictException(
        'Parceiro não está ativo',
      );
    }

    const company = await this.prisma.company.findFirst({
      where: {
        id: dto.companyId,
        deletedAt: null,
      },
    });

    if (!company) {
      throw new NotFoundException(
        'Empresa não encontrada',
      );
    }

    if (company.status !== 'ACTIVE') {
      throw new ConflictException(
        'Empresa não está ativa',
      );
    }

    const existingRelation =
      await this.prisma.partnerCompany.findUnique({
        where: {
          partnerId_companyId: {
            partnerId: dto.partnerId,
            companyId: dto.companyId,
          },
        },
      });

    if (existingRelation) {
      throw new ConflictException(
        'Este parceiro já está associado a esta empresa',
      );
    }

    return this.prisma.partnerCompany.create({
      data: {
        partnerId: dto.partnerId,
        companyId: dto.companyId,
      },
      select: {
        id: true,
        partnerId: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
        partner: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });
  }

  async findAll() {
  return this.prisma.partnerCompany.findMany({
    select: {
      id: true,
      partnerId: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,

      partner: {
        select: {
          id: true,
          name: true,
          type: true,
          email: true,
          status: true,
          companyId: true,
        },
      },

      company: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },

    orderBy: {
      createdAt: 'desc',
    },
  });
}
}