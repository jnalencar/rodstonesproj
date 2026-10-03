import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: process.env.SUPABASE_JWKS_URL!,
      }),

      algorithms: ['ES256'],

      issuer:
        process.env.SUPABASE_ISSUER,
    });
  }

  async validate(
  payload: JwtPayload,
): Promise<AuthenticatedUser> {
  const user = await this.prisma.user.findUnique({
    where: {
      supabaseId: payload.sub,
    },
    select: {
      id: true,
      email: true,
      status: true,
    },
  });

  if (!user || user.status !== 'ACTIVE') {
    throw new UnauthorizedException(
      'Usuário não encontrado ou inativo.',
    );
  }

  return {
    userId: user.id,
    email: user.email,

    membershipId:
      payload.membershipId ?? null,

    companyId:
      payload.companyId ?? null,

    roles:
      payload.roles ?? [],

    permissions:
      payload.permissions ?? [],
  };
}
}