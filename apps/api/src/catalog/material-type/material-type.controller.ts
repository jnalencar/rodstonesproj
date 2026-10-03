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

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CompanyRequired } from '../../auth/decorators/company-required.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { CreateMaterialTypeDto } from './dto/create-material-type.dto';
import { MaterialTypeService } from './material-type.service';
import { UpdateMaterialTypeDto } from './dto/update-material-type.dto';

@Controller('material-types')
export class MaterialTypeController {
  constructor(
    private readonly materialTypeService: MaterialTypeService,
  ) {}

  @Post()
  @CompanyRequired()
  @Permissions('material-type:create')
  create(
    @Body() dto: CreateMaterialTypeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.materialTypeService.create(dto, user);
  }

  @Get()
  @CompanyRequired()
  @Permissions('material-type:read')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.materialTypeService.findAll(user);
  }

  @Get(':id')
  @CompanyRequired()
  @Permissions('material-type:read')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.materialTypeService.findOne(id, user);
  }

  @Patch(':id')
  @CompanyRequired()
  @Permissions('material-type:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaterialTypeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.materialTypeService.update(id, dto, user);
  }

  @Delete(':id')
  @CompanyRequired()
  @Permissions('material-type:delete')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.materialTypeService.remove(id, user);
  }
}