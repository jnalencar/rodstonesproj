import { Module } from '@nestjs/common';

import { MaterialClassificationController } from './material-classification.controller';
import { MaterialClassificationService } from './material-classification.service';

@Module({
  controllers: [MaterialClassificationController],
  providers: [MaterialClassificationService],
  exports: [MaterialClassificationService],
})
export class MaterialClassificationModule {}