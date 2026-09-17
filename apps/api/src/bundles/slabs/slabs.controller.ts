import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

import { SlabsService } from './slabs.service';
import { CreateSlabDto } from './dto/create-slab.dto';

import { CompanyRequired } from '../../auth/decorators/company-required.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Controller('bundles/:bundleId/slabs')
export class SlabsController {
  constructor(
    private readonly slabsService: SlabsService,
  ) {}

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
}