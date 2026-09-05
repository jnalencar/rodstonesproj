import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { PermissionsService } from './permissions.service';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('permissions')
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get('list')
  @Permissions('permission:read')
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @Permissions('permission:read')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.permissionsService.findOne(id);
  }
}