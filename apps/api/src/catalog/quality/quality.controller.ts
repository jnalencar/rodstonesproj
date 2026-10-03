import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { QualityService } from './quality.service';
import { CreateQualityDto } from './dto/create-quality.dto';
import { UpdateQualityDto } from './dto/update-quality.dto';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CompanyRequired } from '../../auth/decorators/company-required.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Controller('qualities')
export class QualityController {
  constructor(
    private readonly qualityService: QualityService,
  ) {}

  @Post()
  @CompanyRequired()
  @Permissions('quality:create')
  create(
    @Body() dto: CreateQualityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.qualityService.create(dto, user);
  }

  @Get()
  @CompanyRequired()
  @Permissions('quality:read')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.qualityService.findAll(user);
  }

  @Get(':id')
  @CompanyRequired()
  @Permissions('quality:read')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.qualityService.findOne(id, user);
  }

  @Patch(':id')
  @CompanyRequired()
  @Permissions('quality:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQualityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.qualityService.update(id, dto, user);
  }

  @Delete(':id')
  @CompanyRequired()
  @Permissions('quality:delete')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.qualityService.remove(id, user);
  }
}