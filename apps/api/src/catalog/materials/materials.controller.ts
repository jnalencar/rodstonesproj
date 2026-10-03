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

import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

import { CompanyRequired } from '../../auth/decorators/company-required.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Controller('materials')
export class MaterialsController {
  constructor(
    private readonly materialsService: MaterialsService,
  ) {}

  @Post('create')
  @CompanyRequired()
  @Permissions('material:create')
  create(
    @Body() dto: CreateMaterialDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.materialsService.create(dto, user);
  }

  @Get()
  @CompanyRequired()
  @Permissions('material:read')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.materialsService.findAll(user);
  }

  @Get(':id')
  @CompanyRequired()
  @Permissions('material:read')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.materialsService.findOne(id, user);
  }

  @Patch(':id')
  @CompanyRequired()
  @Permissions('material:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaterialDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.materialsService.update(id, dto, user);
  }

  @Delete(':id')
  @CompanyRequired()
  @Permissions('material:delete')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.materialsService.remove(id, user);
  }
}