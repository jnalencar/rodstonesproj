import { Module } from '@nestjs/common';

import { NegotiationsController } from './negotiations.controller';
import { NegotiationsService } from './negotiations.service';
import { StorageModule } from '../storage/storage.module';

@Module({
    imports: [StorageModule],
    controllers: [NegotiationsController],
    providers: [NegotiationsService],
    exports: [NegotiationsService],
})
export class NegotiationsModule {}