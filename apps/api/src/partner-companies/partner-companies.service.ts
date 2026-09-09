import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerCompanyDto } from './dto/create-partner-company.dto';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { UpdatePartnerCompanyDto } from './dto/update-partner-company.dto';

@Injectable()
export class PartnerCompaniesService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

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

  async findOne(
    id: number,
    user: AuthenticatedUser,
  ) {
    if (!user.companyId) {
      throw new NotFoundException(
        'Usuário não possui uma empresa selecionada',
      );
    }

    const partnerCompany =
      await this.prisma.partnerCompany.findFirst({
        where: {
          id,
          companyId: user.companyId,
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
              email: true,
              phone: true,
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

    if (!partnerCompany) {
      throw new NotFoundException(
        'Vínculo entre parceiro e empresa não encontrado',
      );
    }

    return partnerCompany;
  }
  async remove(
    id: number,
    user: AuthenticatedUser,
  ) {
    if (!user.companyId) {
      throw new NotFoundException(
        'Usuário não possui uma empresa selecionada',
      );
    }

    const partnerCompany =
      await this.prisma.partnerCompany.findFirst({
        where: {
          id,
          companyId: user.companyId,
        },
      });

    if (!partnerCompany) {
      throw new NotFoundException(
        'Vínculo entre parceiro e empresa não encontrado',
      );
    }

    await this.prisma.partnerCompany.delete({
      where: {
        id: partnerCompany.id,
      },
    });

    return {
      message: 'Vínculo removido com sucesso',
    };
  }
  async update(
    id: number,
    dto: UpdatePartnerCompanyDto,
    user: AuthenticatedUser,
  ) {
    if (!user.companyId) {
      throw new NotFoundException(
        'Usuário não possui uma empresa selecionada',
      );
    }

    const partnerCompany =
      await this.prisma.partnerCompany.findFirst({
        where: {
          id,
          companyId: user.companyId,
        },
      });

    if (!partnerCompany) {
      throw new NotFoundException(
        'Vínculo entre parceiro e empresa não encontrado',
      );
    }

    return {
      message: 'Nenhum campo disponível para atualização neste momento',
      id: partnerCompany.id,
    };
  }
}