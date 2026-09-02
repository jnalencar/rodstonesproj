import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SwitchCompanyDto } from './dto/switch-company.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuário não está ativo');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      roles: [],
      permissions: [],
    };

    const accessToken = await this.jwtService.signAsync(payload);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    return {
      accessToken,
      payload,
    };
  }

  async getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,

        memberships: {
          where: {
            status: 'ACTIVE',
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

      userRole.role.permissions.forEach((rolePermission) => {
        permissions.add(rolePermission.permission.code);
      });
    });
    
    const payload = {
      sub: userId,
      email: user.email,
      membershipId: membership.id,
      companyId: membership.companyId,
      roles: Array.from(roles),
      permissions: Array.from(permissions),
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken, payload };
  }
}