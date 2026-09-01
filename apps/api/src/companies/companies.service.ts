import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async create(
    dto: CreateCompanyDto,
    user: AuthenticatedUser,
  ) {
    if (dto.document) {
      const existingCompany =
        await this.prisma.company.findUnique({
          where: {
            document: dto.document,
          },
        });

      if (existingCompany) {
        throw new ConflictException(
          'Já existe uma empresa cadastrada com este documento',
        );
      }
    }

    const companyAdminRole =
      await this.prisma.role.findUnique({
        where: {
          code: 'COMPANY_ADMIN',
        },
      });

    if (!companyAdminRole) {
      throw new NotFoundException(
        'Role COMPANY_ADMIN não encontrada',
      );
    }

    const result = await this.prisma.$transaction(
      async (tx) => {
        const company = await tx.company.create({
          data: {
            name: dto.name,
            legalName: dto.legalName,
            document: dto.document,
            email: dto.email,
            phone: dto.phone,
          },
        });

        const membership =
          await tx.companyMembership.create({
            data: {
              userId: user.userId,
              companyId: company.id,
              status: 'ACTIVE',
            },
          });

        await tx.userRole.create({
          data: {
            membershipId: membership.id,
            roleId: companyAdminRole.id,
          },
        });

        return {
          company,
          membership: {
            id: membership.id,
            userId: membership.userId,
            companyId: membership.companyId,
            status: membership.status,
          },
          role: {
            id: companyAdminRole.id,
            code: companyAdminRole.code,
          },
        };
      },
    );

    return result;
  }

  async findAll(user: AuthenticatedUser) {
    return this.prisma.company.findMany({
      where: {
        deletedAt: null,

        memberships: {
          some: {
            userId: user.userId,
            status: 'ACTIVE',
          },
        },
      },

      orderBy: {
        name: 'asc',
      },

      select: {
        id: true,
        name: true,
        legalName: true,
        document: true,
        status: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });
  }

  async findOne(
    companyId: number,
    user: AuthenticatedUser,
  ) {
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        legalName: true,
        document: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const isPlatformAdmin = user.roles?.includes('PLATFORM_ADMIN');

    if (!isPlatformAdmin) {
      const membership = await this.prisma.companyMembership.findFirst({
        where: {
          userId: user.userId,
          companyId,
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new ForbiddenException(
          'Você não possui acesso a esta empresa',
        );
      }
    }

    return company;
  }

  async update(
    companyId: number,
    dto: UpdateCompanyDto,
    user: AuthenticatedUser
  ) {
    const company = await this.prisma.company.findFirst({
      where: {
        id: companyId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    const isPlatformAdmin = user.roles?.includes('PLATFORM_ADMIN');

    if (!isPlatformAdmin) {
      const membership = await this.prisma.companyMembership.findFirst({
        where: {
          userId: user.userId,
          companyId,
          status: 'ACTIVE',
        },
      });

      if (!membership) {
        throw new ForbiddenException('Você não possui acesso a essa empresa');
      }
    }

    return this.prisma.company.update({
      where: {
        id: companyId,
      },
      data: dto,
      select: {
        id: true,
        name: true,
        legalName: true,
        document: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }

    });
  }

  async remove(id: number, user: AuthenticatedUser) {
    const company = await this.prisma.company.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    await this.prisma.company.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
      },
    });

    return {
      message: 'Empresa excluída com sucesso',
    };
  }
}