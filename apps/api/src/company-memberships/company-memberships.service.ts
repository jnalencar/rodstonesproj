import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompanyMembershipDto } from './dto/create-company-membership.dto';
import { UpdateCompanyMembershipDto } from './dto/update-company-membership.dto';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateMembershipRolesDto } from './dto/update-membership-roles.dto';

@Injectable()
export class CompanyMembershipsService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async create(
    dto: CreateCompanyMembershipDto,
    user: AuthenticatedUser,
  ) {
    const companyId = user.companyId;

    if (!companyId) {
      throw new NotFoundException(
        'Usuário não pertence a nenhuma empresa',
      );
    }

    const targetUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException(
        'Usuário não encontrado',
      );
    }

    if (targetUser.status !== 'ACTIVE') {
      throw new ConflictException(
        'Usuário não está ativo',
      );
    }

    const existingMembership =
      await this.prisma.companyMembership.findUnique({
        where: {
          userId_companyId: {
            userId: targetUser.id,
            companyId,
          },
        },
      });

    if (existingMembership) {
      throw new ConflictException(
        'Usuário já pertence a esta empresa',
      );
    }

    return this.prisma.companyMembership.create({
      data: {
        userId: targetUser.id,
        companyId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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

  async findAll(user: AuthenticatedUser) {

    if (!user.companyId) {
      throw new NotFoundException(
        'Usuário não pertence a nenhuma empresa',
      );
    }
    return this.prisma.companyMembership.findMany({
      where: {
        companyId: user.companyId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
        roles: {
          select: {
            role: {
              select: {
                code: true,
                name: true,
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

  async findOne(
    id: number,
    user: AuthenticatedUser,
  ) {
    if (!user.companyId) {
      throw new NotFoundException(
        'Usuário não pertence a nenhuma empresa',
      );
    }
    const membership =
      await this.prisma.companyMembership.findFirst({
        where: {
          id,
          companyId: user.companyId,
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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
          roles: {
            select: {
              role: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      });

    if (!membership) {
      throw new NotFoundException(
        'Membro não encontrado',
      );
    }

    return membership;
  }

  async update(id: number, dto: UpdateCompanyMembershipDto) {
    const membership = await this.prisma.companyMembership.findUnique({
      where: { id },
    });

    if (!membership) {
      throw new NotFoundException('Vínculo não encontrado');
    }

    return this.prisma.companyMembership.update({
      where: { id },
      data: {
        status: dto.status,
      },
      select: {
        id: true,
        userId: true,
        companyId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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

  async remove(id: number) {
    const membership = await this.prisma.companyMembership.findUnique({
      where: { id },
    });

    if (!membership || membership.deletedAt) {
      throw new NotFoundException('Vínculo não encontrado');
    }

    await this.prisma.companyMembership.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Vínculo removido com sucesso',
    };
  }

  async updateRoles(
    id: number,
    dto: UpdateMembershipRolesDto,
    user: AuthenticatedUser,
  ) {
    if (!user.companyId) {
      throw new NotFoundException(
        'Usuário não pertence a nenhuma empresa',
      );
    }

    const membership =
      await this.prisma.companyMembership.findFirst({
        where: {
          id,
          companyId: user.companyId,
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: {
          id: true,
          userId: true,
          companyId: true,
        },
      });

    if (!membership) {
      throw new NotFoundException('Membro não encontrado');
    }

    const requestedRoles = [...new Set(dto.roles)];

    const roles = await this.prisma.role.findMany({
      where: {
        code: {
          in: requestedRoles,
        },
        OR: [
          {
            companyId: null,
          },
          {
            companyId: user.companyId,
          },
        ],
      },
      select: {
        id: true,
        code: true,
        name: true,
        companyId: true,
        isSystem: true,
      },
    });

    const foundCodes = new Set(
      roles.map((role) => role.code),
    );

    const invalidRoles = requestedRoles.filter(
      (code) => !foundCodes.has(code),
    );

    if (invalidRoles.length) {
      throw new NotFoundException(
        `Roles inválidos ou não disponíveis: ${invalidRoles.join(', ')}`,
      );
    }

    const forbiddenPlatformAdmin = roles.some(
      (role) => role.code === 'PLATFORM_ADMIN',
    );

    if (forbiddenPlatformAdmin) {
      throw new ForbiddenException(
        'PLATFORM_ADMIN não pode ser atribuído por uma empresa',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: {
          membershipId: membership.id,
        },
      });

      if (roles.length > 0) {
        await tx.userRole.createMany({
          data: roles.map((role) => ({
            membershipId: membership.id,
            roleId: role.id,
          })),
          skipDuplicates: true,
        });
      }
    });


    return this.prisma.companyMembership.findUnique({
      where: {
        id: membership.id,
      },
      select: {
        id: true,
        userId: true,
        companyId: true,
        status: true,
        roles: {
          select: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
                description: true,
                companyId: true,
                isSystem: true,
              },
            },
          },
        },
      },
    });
  }

}
