import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { PartnerCompaniesService } from './partner-companies.service';
import { CreatePartnerCompanyDto } from './dto/create-partner-company.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('partner-companies')
export class PartnerCompaniesController {
  constructor(
    private readonly partnerCompaniesService: PartnerCompaniesService,
  ) {}

  @Post('create')
  @Permissions('partnerCompany:create')
  create(@Body() dto: CreatePartnerCompanyDto) {
    return this.partnerCompaniesService.create(dto);
  }
}