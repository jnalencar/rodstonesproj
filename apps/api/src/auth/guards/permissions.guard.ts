import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const userPermissions = user.permissions ?? [];
    if (userPermissions.length) {
      return requiredPermissions.every((permission) =>
        userPermissions.includes(permission),
      );
    }

    const memberships = await this.prisma.companyMembership.findMany({
      where: {
        userId: user.userId,
        status: 'ACTIVE',
      },
      select: {
        roles: {
          select: {
            role: {
              select: {
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

    const permissions = new Set<string>();

    memberships.forEach((membership) => {
      membership.roles.forEach((userRole) => {
        userRole.role.permissions.forEach((rolePermission) => {
          permissions.add(rolePermission.permission.code);
        });
      });
    });

    return requiredPermissions.every((permission) =>
      permissions.has(permission),
    );
  }
}