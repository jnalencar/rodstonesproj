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

  { code: 'share:read', description: 'Visualizar compartilhamentos' },
  { code: 'share:create', description: 'Criar compartilhamentos' },
  { code: 'share:update', description: 'Atualizar compartilhamentos' },
  { code: 'share:delete', description: 'Excluir compartilhamentos' },

  { code: 'reservation:read', description: 'Visualizar reservas' },
  { code: 'reservation:create', description: 'Criar reservas' },
  { code: 'reservation:approve', description: 'Aprovar reservas' },
  { code: 'reservation:reject', description: 'Rejeitar reservas' },

  { code: 'partner:read', description: 'Visualizar parceiros' },
  { code: 'partner:create', description: 'Criar parceiros' },
  { code: 'partner:update', description: 'Atualizar parceiros' },
  { code: 'partner:delete', description: 'Excluir parceiros' },

  { code: 'membership:read', description: 'Visualizar membros' },
  { code: 'membership:create', description: 'Criar membros' },
  { code: 'membership:update', description: 'Atualizar membros' },
  { code: 'membership:delete', description: 'Excluir membros' },

  { code: 'role:read', description: 'Visualizar papéis' },
  { code: 'role:create', description: 'Criar papéis' },
  { code: 'role:update', description: 'Atualizar papéis' },
  { code: 'role:delete', description: 'Excluir papéis' },

  { code: 'permission:read', description: 'Visualizar permissões' },
  { code: 'permission:create', description: 'Criar permissões' },
  { code: 'permission:update', description: 'Atualizar permissões' },
  { code: 'permission:delete', description: 'Excluir permissões' },
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
  PLATFORM_ADMIN: ['company:read', 'company:create', 'company:update', 'company:delete'],
  COMPANY_ADMIN: [],
  MANAGER: [],
  SELLER: [],
  PARTNER_ADMIN: [],
  PARTNER_SELLER: []
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
  await prisma.role.upsert({
    where: { code: role.code },
    update: {
      description: role.description,
      isSystem: role.isSystem,
    },
    create: {
      code: role.code,
      name: role.code,
      description: role.description,
      isSystem: role.isSystem,
    },
  });
}
  for (const [roleCode, permissionCodes] of Object.entries(rolePermissions)) {
  const role = await prisma.role.findUnique({
    where: { code: roleCode },
  });

  if (!role) {
    throw new Error(`Role ${roleCode} não encontrada`);
  }

  for (const permissionCode of permissionCodes) {
    const permission = await prisma.permission.findUnique({
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