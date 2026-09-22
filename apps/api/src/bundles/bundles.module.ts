import { Module } from '@nestjs/common';

import { BundlesController } from './bundles.controller';
import { BundlesService } from './bundles.service';

import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { SlabsController } from './slabs/slabs.controller';
import { SlabsService } from './slabs/slabs.service';
import { SlabImagesController } from './slabs/images/slab-images.controller';
import { SlabImagesService } from './slabs/images/slab-images.service';
import { BundleImagesController } from './images/bundle-images.controller';
import { BundleImagesService } from './images/bundle-images.service';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
  ],
  controllers: [BundlesController, SlabsController, SlabImagesController, BundleImagesController],
  providers: [BundlesService, SlabsService, SlabImagesService, BundleImagesService],
})
export class BundlesModule {}