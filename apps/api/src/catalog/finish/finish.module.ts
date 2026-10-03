import { Module } from '@nestjs/common';

import { FinishService } from './finish.services';
import { FinishController } from './finish.controller';

@Module({
  controllers: [FinishController],
  providers: [FinishService],
  exports: [FinishService],
})
export class FinishModule {}