import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { CompanyMembershipsModule } from './company-memberships/company-memberships.module';
import { APP_GUARD } from '@nestjs/core';
import { GlobalJwtAuthGuard } from './auth/guards/global-jwt-auth-guards';
import { CompanyContextGuard } from './auth/guards/company-context.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { UsersModule } from './users/users.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { PartnersModule } from './partners/partners.module';
import { PartnerCompaniesModule } from './partner-companies/partner-companies.module';
import { MaterialsModule } from './materials/materials.module';

@Module({
  imports: [PrismaModule, AuthModule, CompaniesModule, CompanyMembershipsModule, UsersModule, PermissionsModule, RolesModule, PartnersModule, PartnerCompaniesModule, MaterialsModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: GlobalJwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CompanyContextGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}