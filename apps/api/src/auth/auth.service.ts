import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { SwitchCompanyDto } from './dto/switch-company.dto';


@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        supabaseId: true,
        name: true,
        email: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,

        memberships: {
          where: {
            status: 'ACTIVE',
            deletedAt: null,
            company: {
              status: 'ACTIVE',
              deletedAt: null,
            },
          },
          select: {
            id: true,
            status: true,

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
        },
      },
    });
  }

  async switchCompany(
    userId: number,
    dto: SwitchCompanyDto,
  ) {
    const membership =
      await this.prisma.companyMembership.findFirst({
        where: {
          userId,
          companyId: dto.companyId,
          status: 'ACTIVE',
          deletedAt: null,
          company: {
            status: 'ACTIVE',
            deletedAt: null,
          },
        },
        select: {
          id: true,
          companyId: true,

          company: {
            select: {
              id: true,
              name: true,
            },
          },

          roles: {
            select: {
              role: {
                select: {
                  code: true,

                  permissions: {
                    select: {
                      permission: {
                        select: {
                          code: true,
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

    if (!membership) {
      throw new UnauthorizedException(
        'Você não possui acesso a esta empresa',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        status: true,
        supabaseId: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'Usuário não está ativo',
      );
    }

    const permissions = new Set<string>();
    const roles = new Set<string>();

    membership.roles.forEach((userRole) => {
      roles.add(userRole.role.code);

      userRole.role.permissions.forEach(
        (rolePermission) => {
          permissions.add(
            rolePermission.permission.code,
          );
        },
      );
    });

    return {
      companyId: membership.companyId,
      membershipId: membership.id,
      roles: Array.from(roles),
      permissions: Array.from(permissions),
    };
  }
}