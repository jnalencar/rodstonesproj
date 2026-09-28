import { Module } from '@nestjs/common';

import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { PublicReservationsController } from './reservations-public.controller';

@Module({
  controllers: [ReservationsController, PublicReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}