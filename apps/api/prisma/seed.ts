import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const permissions: { code: string; description: string }[] = [
  { code: 'company:read', description: 'Visualizar empresas' },
  { code: 'company:create', description: 'Criar empresas' },
  { code: 'company:update', description: 'Atualizar empresas' },
  { code: 'company:delete', description: 'Excluir empresas' },

  { code: 'user:read', description: 'Visualizar usuários' },
  { code: 'user:create', description: 'Criar usuários' },
  { code: 'user:update', description: 'Atualizar usuários' },
  { code: 'user:delete', description: 'Excluir usuários' },

  { code: 'bundle:read', description: 'Visualizar bundles' },
  { code: 'bundle:create', description: 'Criar bundles' },
  { code: 'bundle:update', description: 'Atualizar bundles' },
  { code: 'bundle:delete', description: 'Excluir bundles' },
  { code: 'bundle:availability', description: 'Gerenciar disponibilidade de bundles' },

  { code: 'bundle:image:read', description: 'Visualizar imagens de bundles' },
  { code: 'bundle:image:create', description: 'Criar imagens de bundles' },
  { code: 'bundle:image:update', description: 'Atualizar imagens de bundles' },
  { code: 'bundle:image:delete', description: 'Excluir imagens de bundles' },

  { code: 'slab:read', description: 'Visualizar slabs' },
  { code: 'slab:create', description: 'Criar slabs' },
  { code: 'slab:update', description: 'Atualizar slabs' },
  { code: 'slab:delete', description: 'Excluir slabs' },
  { code: 'slab:availability', description: 'Gerenciar disponibilidade de slabs' },

  { code: 'slab:image:read', description: 'Visualizar imagens de slabs' },
  { code: 'slab:image:create', description: 'Criar imagens de slabs' },
  { code: 'slab:image:update', description: 'Atualizar imagens de slabs' },
  { code: 'slab:image:delete', description: 'Excluir imagens de slabs' },

  { code: 'share:read', description: 'Visualizar compartilhamentos' },
  { code: 'share:create', description: 'Criar compartilhamentos' },
  { code: 'share:update', description: 'Atualizar compartilhamentos' },
  { code: 'share:delete', description: 'Excluir compartilhamentos' },
  { code: 'share:revoke', description: 'Revogar compartilhamentos' },

  { code: 'reservation:read', description: 'Visualizar reservas' },
  { code: 'reservation:create', description: 'Criar reservas' },
  { code: 'reservation:approve', description: 'Aprovar reservas' },
  { code: 'reservation:reject', description: 'Rejeitar reservas' },
  { code: 'reservation:cancel', description: 'Cancelar reservas' },
  { code: 'reservation:release', description: 'Liberar reservas' },

  { code: 'partner:read', description: 'Visualizar parceiros' },
  { code: 'partner:create', description: 'Criar parceiros' },
  { code: 'partner:update', description: 'Atualizar parceiros' },
  { code: 'partner:delete', description: 'Excluir parceiros' },
  
  { code: 'partner:pricing', description: 'Gerenciar preços e margens de revenda de parceiros' },
  { code: 'partner:price:read', description: 'Visualizar preço de revenda' },
  { code: 'partner:price:update', description: 'Alterar preço de revenda'},

  { code: 'membership:read', description: 'Visualizar membros' },
  { code: 'membership:create', description: 'Criar membros' },
  { code: 'membership:update', description: 'Atualizar membros' },
  { code: 'membership:delete', description: 'Excluir membros' },
  { code: 'membership:roles', description: 'Gerenciar papéis de membros' },

  { code: 'role:read', description: 'Visualizar papéis' },
  { code: 'role:create', description: 'Criar papéis' },
  { code: 'role:update', description: 'Atualizar papéis' },
  { code: 'role:delete', description: 'Excluir papéis' },

  { code: 'permission:read', description: 'Visualizar permissões' },

  { code: 'partnerCompany:read', description: 'Visualizar empresas de parceiros' },
  { code: 'partnerCompany:create', description: 'Criar empresas de parceiros' },
  { code: 'partnerCompany:update', description: 'Atualizar empresas de parceiros' },
  { code: 'partnerCompany:delete', description: 'Excluir empresas de parceiros' },

  { code: 'audit:read', description: 'Visualizar auditorias' },

  { code: 'notification:read', description: 'Visualizar notificações' },
  { code: 'notification:manage', description: 'Gerenciar notificações' },

  { code: 'material:read', description: 'Visualizar materiais' },
  { code: 'material:create', description: 'Criar materiais' },
  { code: 'material:update', description: 'Atualizar materiais' },
  { code: 'material:delete', description: 'Excluir materiais' },

  { code: 'client:read', description: 'Visualizar clientes' },
  { code: 'client:create', description: 'Criar clientes' },
  { code: 'client:update', description: 'Atualizar clientes' },
  { code: 'client:delete', description: 'Excluir clientes' },

];

const roles: { code: string; description: string; isSystem: boolean }[] = [
  { code: 'PLATFORM_ADMIN', description: 'Administrador da plataforma', isSystem: true },
  { code: 'COMPANY_ADMIN', description: 'Administrador da empresa', isSystem: true },
  { code: 'MANAGER', description: 'Gerente', isSystem: true },
  { code: 'SELLER', description: 'Vendedor', isSystem: true },
  { code: 'PARTNER_ADMIN', description: 'Administrador do parceiro', isSystem: true },
  { code: 'PARTNER_SELLER', description: 'Vendedor do parceiro', isSystem: true },
];

const rolePermissions = {
  PLATFORM_ADMIN: [
    'company:read',
    'company:create',
    'company:update',
    'company:delete',

    'user:read',
    'user:create',
    'user:update',
    'user:delete',

    'bundle:read',
    'bundle:create',
    'bundle:update',
    'bundle:delete',
    'bundle:availability',

    'bundle:image:read',
    'bundle:image:create',
    'bundle:image:update',
    'bundle:image:delete',

    'slab:read',
    'slab:create',
    'slab:update',
    'slab:delete',

    'slab:image:read',
    'slab:image:create',
    'slab:image:update',
    'slab:image:delete',
    'slab:availability',

    'share:read',
    'share:create',
    'share:update',
    'share:delete',
    'share:revoke',

    'reservation:read',
    'reservation:create',
    'reservation:approve',
    'reservation:reject',
    'reservation:cancel',
    'reservation:release',

    'partner:read',
    'partner:create',
    'partner:update',
    'partner:delete',

    'membership:read',
    'membership:create',
    'membership:update',
    'membership:delete',

    'role:read',
    'role:create',
    'role:update',
    'role:delete',

    'permission:read',

    'partnerCompany:read',
    'partnerCompany:create',
    'partnerCompany:update',
    'partnerCompany:delete',

    'audit:read',

    'notification:read',
    'notification:manage',

    'material:read',
    'material:create',
    'material:update',
    'material:delete',

    'client:read',
    'client:create',
    'client:update',
    'client:delete',
  ],

  COMPANY_ADMIN: [
    'company:read',
    'company:update',

    'user:read',
    'user:create',
    'user:update',
    'user:delete',

    'bundle:read',
    'bundle:create',
    'bundle:update',
    'bundle:delete',
    'bundle:availability',

    'bundle:image:read',
    'bundle:image:create',
    'bundle:image:update',
    'bundle:image:delete',

    'slab:read',
    'slab:create',
    'slab:update',
    'slab:delete',
    'slab:availability',

    'slab:image:read',
    'slab:image:create',
    'slab:image:update',
    'slab:image:delete',

    'share:read',
    'share:create',
    'share:update',
    'share:delete',
    'share:revoke',

    'reservation:read',
    'reservation:create',
    'reservation:approve',
    'reservation:reject',
    'reservation:cancel',
    'reservation:release',

    'membership:read',
    'membership:create',
    'membership:update',
    'membership:delete',

    'role:read',
    'role:create',
    'role:update',
    'role:delete',

    'permission:read',

    'partnerCompany:read',

    'audit:read',

    'partner:read',

    'notification:read',
    'notification:manage',

    'material:read',
    'material:create',
    'material:update',
    'material:delete',

    'client:read',
    'client:create',
    'client:update',
    'client:delete',
  ],

  MANAGER: [
    'company:read',

    'user:read',

    'bundle:read',
    'bundle:create',
    'bundle:update',
    'bundle:delete',
    'bundle:availability',

    'bundle:image:read',
    'bundle:image:create',
    'bundle:image:update',
    'bundle:image:delete',

    'slab:read',
    'slab:create',
    'slab:update',
    'slab:delete',
    'slab:availability',

    'slab:image:read',
    'slab:image:create',
    'slab:image:update',
    'slab:image:delete',

    'share:read',
    'share:create',
    'share:update',
    'share:delete',
    'share:revoke',

    'reservation:read',
    'reservation:create',
    'reservation:approve',
    'reservation:reject',
    'reservation:cancel',
    'reservation:release',

    'membership:read',

    'audit:read',

    'notification:read',

    'client:read',
    'client:create',
    'client:update',
    'client:delete',
  ],

  SELLER: [
    'company:read',

    'user:read',

    'bundle:read',

    'bundle:image:read',

    'slab:read',
    'slab:availability',

    'slab:image:read',

    'share:read',
    'share:create',
    'share:update',
    'share:delete',
    'share:revoke',

    'reservation:read',
    'reservation:create',
    'reservation:cancel',

    'notification:read',

    'client:read',
    'client:create',
    'client:update',
    'client:delete',
  ],

  PARTNER_ADMIN: [
    'company:read',

    'user:read',
    'user:create',
    'user:update',
    'user:delete',

    'bundle:read',
    'bundle:image:read',

    'slab:read',
    'slab:availability',
    'slab:image:read',

    'share:read',
    'share:create',
    'share:update',
    'share:delete',
    'share:revoke',

    'reservation:read',
    'reservation:create',
    'reservation:approve',
    'reservation:reject',
    'reservation:cancel',
    'reservation:release',

    'partner:read',
    'partner:price:read',
    'partner:price:update',

    'membership:read',
    'membership:create',
    'membership:update',
    'membership:delete',

    'partnerCompany:read',
    'partnerCompany:create',
    'partnerCompany:update',

    'audit:read',

    'notification:read',
    'notification:manage',

    'client:read',
    'client:create',
    'client:update',
    'client:delete',
  ],

  PARTNER_SELLER: [
    'company:read',

    'user:read',

    'bundle:read',
    'bundle:image:read',

    'slab:read',
    'slab:availability',
    'slab:image:read',

    'partner:price:read',

    'share:read',
    'share:create',
    'share:update',
    'share:revoke',

    'reservation:read',
    'reservation:create',
    'reservation:cancel',

    'notification:read',

    'client:read',
    'client:create',
    'client:update',
    'client:delete',
  ],
};

async function main() {
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { description: permission.description },
      create: {
        code: permission.code,
        name: permission.code,
        description: permission.description,
      },
    });
  }

  for (const role of roles) {
    const existingRole = await prisma.role.findFirst({
      where: { code: role.code },
    });

    if (existingRole) {
      await prisma.role.update({
        where: { id: existingRole.id },
        data: {
          description: role.description,
          isSystem: role.isSystem,
          companyId: null,
        },
      });
    } else {
      await prisma.role.create({
        data: {
          code: role.code,
          name: role.code,
          description: role.description,
          isSystem: role.isSystem,
          companyId: null,
        },
      });
    }
  }
  for (const [roleCode, permissionCodes] of Object.entries(rolePermissions)) {
    const role = await prisma.role.findFirst({
      where: { code: roleCode },
    });

    if (!role) {
      throw new Error(`Role ${roleCode} não encontrada`);
    }

    for (const permissionCode of permissionCodes) {
      const permission = await prisma.permission.findFirst({
        where: { code: permissionCode },
      });

      if (!permission) {
        throw new Error(`Permission ${permissionCode} não encontrada`);
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());