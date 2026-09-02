import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { COMPANY_REQUIRED_KEY } from '../decorators/company-required.decorator';

@Injectable()
export class CompanyContextGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const companyRequired = this.reflector.getAllAndOverride<boolean>(
      COMPANY_REQUIRED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!companyRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    if (!user.membershipId || !user.companyId) {
      throw new UnauthorizedException(
        'Nenhuma empresa foi selecionada. Selecione uma empresa para continuar.',
      );
    }

    return true;
  }
}