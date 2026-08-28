import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
  ) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('company:create')
  create(
    @Body() dto: CreateCompanyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companiesService.create(dto, user);
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companiesService.findAll(user);
  }
}