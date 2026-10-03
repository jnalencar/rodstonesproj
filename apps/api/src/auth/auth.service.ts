import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { SwitchCompanyDto } from './dto/switch-company.dto';
import { SupabaseService } from 'src/supabase/supabase.service';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';


@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) { }

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
    user: AuthenticatedUser,
    dto: SwitchCompanyDto,
  ) {
    const membership = await this.prisma.companyMembership.findFirst({
      where: {
        userId: user.userId,
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
        user: {
          select: {
            supabaseId: true,
          },
        },
      },
    });

    if (!membership) {
      throw new UnauthorizedException(
        'Você não possui acesso a esta empresa',
      );
    }

    const { data, error } =
      await this.supabase.auth.admin.updateUserById(
        membership.user.supabaseId,
        {
          app_metadata: {
            active_company_id: membership.companyId,
          },
        },
      );

    console.log('SWITCH COMPANY:', {
      supabaseId: membership.user.supabaseId,
      companyId: membership.companyId,
      data,
      error,
    });

    return {
      message: 'Empresa alterada com sucesso.',
      company: membership.company,
      membershipId: membership.id,
      requiresTokenRefresh: true,
    };
  }
}