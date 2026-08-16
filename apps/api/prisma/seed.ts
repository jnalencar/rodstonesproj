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

  { code: 'reservation:read', description: 'Visualizar reservas' },
  { code: 'reservation:create', description: 'Criar reservas' },
  { code: 'reservation:approve', description: 'Aprovar reservas' },
  { code: 'reservation:reject', description: 'Rejeitar reservas' },
];

const roles: { code: string; description: string; isSystem: boolean }[] = [
  { code: 'PLATFORM_ADMIN', description: 'Administrador da plataforma', isSystem: true },
  { code: 'COMPANY_ADMIN', description: 'Administrador da empresa', isSystem: true },
  { code: 'MANAGER', description: 'Gerente', isSystem: true },
  { code: 'SELLER', description: 'Vendedor', isSystem: true },
  { code: 'PARTNER_ADMIN', description: 'Administrador do parceiro', isSystem: true },
  { code: 'PARTNER_SELLER', description: 'Vendedor do parceiro', isSystem: true },
];

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
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());