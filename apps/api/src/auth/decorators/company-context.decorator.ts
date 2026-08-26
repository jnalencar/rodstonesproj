import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { CompanyContextData } from '../interfaces/company-context-interface';

export const CompanyContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CompanyContextData => {
    const request = ctx.switchToHttp().getRequest();

    const user = request.user as AuthenticatedUser;

    return {
      companyId: user.companyId!,
      membershipId: user.membershipId!,
    };
  },
);