import { Module } from '@nestjs/common';

import { MaterialTypeService } from './material-type.service';
import { MaterialTypeController } from './material-type.controller';

@Module({
  controllers: [MaterialTypeController],
  providers: [MaterialTypeService],
  exports: [MaterialTypeService],
})
export class MaterialTypeModule {}