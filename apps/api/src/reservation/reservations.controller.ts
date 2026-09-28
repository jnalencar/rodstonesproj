import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ReservationsService } from './reservations.service';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
  ) {}

  @Get()
  @Permissions('reservation:read')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reservationsService.findAll(user);
  }

  @Get(':id')
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
}