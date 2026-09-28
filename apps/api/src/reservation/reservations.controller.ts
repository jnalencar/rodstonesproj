import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';

import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ReservationsService } from './reservations.service';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { CompanyRequired } from 'src/auth/decorators/company-required.decorator';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
  ) {}

  @Get()
  @CompanyRequired()
  @Permissions('reservation:read')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reservationsService.findAll(user);
  }

  @Get(':id')
  @CompanyRequired()
  @Permissions('reservation:read')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reservationsService.findOne(
      id,
      user,
    );
  }

  @Patch(':id/approve')
  @CompanyRequired()
  @Permissions('reservation:approve')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reservationsService.approve(id, user);
  }

  @Patch(':id/reject')
  @CompanyRequired()
  @Permissions('reservation:reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reservationsService.reject(id, user);
  }
}