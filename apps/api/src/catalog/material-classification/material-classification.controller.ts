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
import { MaterialClassificationService } from './material-classification.service';
import { CreateMaterialClassificationDto } from './dto/create-material-classification.dto';
import { UpdateMaterialClassificationDto } from './dto/update-material-classification.dto';

@Controller('material-classifications')
export class MaterialClassificationController {
  constructor(
    private readonly materialClassificationService: MaterialClassificationService,
  ) {}

  @Post()
  @CompanyRequired()
  @Permissions('material-classification:create')
  create(
    @Body() dto: CreateMaterialClassificationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.materialClassificationService.create(dto, user);
  }

  @Get()
  @CompanyRequired()
  @Permissions('material-classification:read')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.materialClassificationService.findAll(user);
  }

  @Get(':id')
  @CompanyRequired()
  @Permissions('material-classification:read')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.materialClassificationService.findOne(id, user);
  }

  @Patch(':id')
  @CompanyRequired()
  @Permissions('material-classification:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaterialClassificationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.materialClassificationService.update(id, dto, user);
  }

  @Delete(':id')
  @CompanyRequired()
  @Permissions('material-classification:delete')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.materialClassificationService.remove(id, user);
  }
}