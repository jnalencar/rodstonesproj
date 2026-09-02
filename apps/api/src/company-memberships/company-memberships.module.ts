import { Module } from '@nestjs/common';
import { CompanyMembershipsService } from './company-memberships.service';
import { CompanyMembershipsController } from './company-memberships.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CompanyMembershipsController],
  providers: [CompanyMembershipsService],
})
export class CompanyMembershipsModule {}
