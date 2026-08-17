import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user.userId;

    const roles = await this.prisma.userRole.findMany({
      where: {
        membership: {
          userId,
          status: 'ACTIVE',
        },
      },
      include: {
        role: true,
      },
    });

    const hasRole = roles.some((userRole) =>
      requiredRoles.includes(userRole.role.code),
    );

    if (!hasRole) {
      throw new ForbiddenException('Acesso negado');
    }

    return true;
  }
}