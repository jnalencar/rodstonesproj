import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { StorageService } from './storage.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('storage')
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
  ) {}

  @Public()
  @Post('test-upload')
  @UseInterceptors(FileInterceptor('file'))
  async testUpload(
    @UploadedFile() file: {
      originalname: string;
      buffer: Buffer;
      mimetype: string;
    },
  ) {
    const key = `bundles/test/${file.originalname}`;

    await this.storageService.upload(
      key,
      file.buffer,
      file.mimetype,
    );

    return {
      message: 'Upload realizado com sucesso',
      key,
    };
  }

  @Public()
  @Get('test-stream')
    async testUrl() {
  const url =
    await this.storageService.getPresignedUrl(
      'bundles/test/sunga joia.jpg',
    );

  return { url };
}
}