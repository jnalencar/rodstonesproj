import { Module } from '@nestjs/common';

import { BundlesController } from './bundles.controller';
import { BundlesService } from './bundles.service';

import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { SlabsController } from './slabs/slabs.controller';
import { SlabsService } from './slabs/slabs.service';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
  ],
  controllers: [BundlesController, SlabsController],
  providers: [BundlesService, SlabsService],
})
export class BundlesModule {}