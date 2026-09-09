import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';

import { PartnerCompaniesService } from './partner-companies.service';
import { CreatePartnerCompanyDto } from './dto/create-partner-company.dto';
import { UpdatePartnerCompanyDto } from './dto/update-partner-company.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CompanyRequired } from 'src/auth/decorators/company-required.decorator';

@Controller('partner-companies')
export class PartnerCompaniesController {
  constructor(
    private readonly partnerCompaniesService: PartnerCompaniesService,
  ) { }

  @Post('create')
  @Permissions('partnerCompany:create')
  create(@Body() dto: CreatePartnerCompanyDto) {
    return this.partnerCompaniesService.create(dto);
  }

  @Get('list')
  @Permissions('partnerCompany:read')
  findAll() {
    return this.partnerCompaniesService.findAll();
  }

  @Get(':id')
  @CompanyRequired()
  @Permissions('partnerCompany:read')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.partnerCompaniesService.findOne(id, user);
  }

  @Patch(':id')
  @CompanyRequired()
  @Permissions('partnerCompany:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePartnerCompanyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.partnerCompaniesService.update(id, dto, user);
  }

  @Delete(':id')
  @CompanyRequired()
  @Permissions('partnerCompany:delete')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.partnerCompaniesService.remove(id, user);
  }
}