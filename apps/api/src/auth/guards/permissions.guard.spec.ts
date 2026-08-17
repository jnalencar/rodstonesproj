import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
  it('allows access when the user has the required permission from their roles', async () => {
    const prisma = {
      companyMembership: {
        findMany: jest.fn().mockResolvedValue([
          {
            roles: [
              {
                role: {
                  permissions: [
                    { permission: { code: 'company:read' } },
                    { permission: { code: 'bundle:create' } },
                  ],
                },
              },
            ],
          },
        ]),
      },
    };

    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['company:read']);

    const guard = new PermissionsGuard(reflector, prisma as any);
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { userId: 42 } }),
      }),
    } as any;

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
