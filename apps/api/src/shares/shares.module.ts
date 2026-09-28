import { Module } from '@nestjs/common';

import { StorageModule } from '../storage/storage.module';

import { SharesController } from './shares.controller';
import { SharesService } from './shares.service';
import { ShareExpirationService } from './shares-expiration.service';

@Module({
  imports: [StorageModule],
  controllers: [SharesController],
  providers: [SharesService, ShareExpirationService],
  exports: [SharesService],
})
export class SharesModule {}