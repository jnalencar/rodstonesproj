import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Get,
  Patch,
  Delete,
} from '@nestjs/common';

import { SlabsService } from './slabs.service';
import { CreateSlabDto } from './dto/create-slab.dto';

import { CompanyRequired } from '../../auth/decorators/company-required.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { UpdateSlabDto } from './dto/update-slab.dto';

@Controller('bundles/:bundleId/slabs')
export class SlabsController {
  constructor(
    private readonly slabsService: SlabsService,
  ) { }

  @Post()
  @CompanyRequired()
  @Permissions('slab:create')
  create(
    @Param('bundleId', ParseIntPipe)
    bundleId: number,

    @Body() dto: CreateSlabDto,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.slabsService.create(
      bundleId,
      dto,
      user,
    );
  }

  @Get()
  @CompanyRequired()
  @Permissions('slab:read')
  findAll(
    @Param('bundleId', ParseIntPipe)
    bundleId: number,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.slabsService.findAll(
      bundleId,
      user,
    );
  }

  @Get(':slabId')
  @CompanyRequired()
  @Permissions('slab:read')
  findOne(
    @Param('bundleId', ParseIntPipe)
    bundleId: number,

    @Param('slabId', ParseIntPipe)
    slabId: number,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.slabsService.findOne(
      bundleId,
      slabId,
      user,
    );
  }

  @Patch(':slabId')
  @CompanyRequired()
  @Permissions('slab:update')
  update(
    @Param('bundleId', ParseIntPipe) bundleId: number,
    @Param('slabId', ParseIntPipe) slabId: number,
    @Body() dto: UpdateSlabDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.slabsService.update(
      bundleId,
      slabId,
      dto,
      user,
    );
  }

  @Delete(':slabId')
  @CompanyRequired()
  @Permissions('slab:delete')
  remove(
    @Param('bundleId', ParseIntPipe) bundleId: number,
    @Param('slabId', ParseIntPipe) slabId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.slabsService.remove(
      bundleId,
      slabId,
      user,
    );
  }
}