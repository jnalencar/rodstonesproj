import { Module } from '@nestjs/common';
import { PartnerCompaniesController } from './partner-companies.controller';
import { PartnerCompaniesService } from './partner-companies.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PartnerCompaniesController],
  providers: [PartnerCompaniesService],
  exports: [PartnerCompaniesService],
})
export class PartnerCompaniesModule {}