import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class CompanyContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
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