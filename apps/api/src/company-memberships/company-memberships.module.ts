import { Module } from '@nestjs/common';
import { CompanyMembershipsService } from './company-memberships.service';
import { CompanyMembershipsController } from './company-memberships.controller';

@Module({
  controllers: [CompanyMembershipsController],
  providers: [CompanyMembershipsService],
})
export class CompanyMembershipsModule {}
