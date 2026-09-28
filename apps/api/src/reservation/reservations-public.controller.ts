import {
  Body,
  Controller,
  Param,
  Post,
} from '@nestjs/common';

import { Public } from '../auth/decorators/public.decorator';
import { CreateReservationRequestDto } from './dto/create-reservation-request.dto';
import { ReservationsService } from './reservations.service';

@Controller('shares')
export class PublicReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
  ) {}

  @Post(':token/reservation-requests')
  @Public()
  create(
    @Param('token') token: string,
    @Body() dto: CreateReservationRequestDto,
  ) {
    return this.reservationsService.create(token, dto);
  }
}