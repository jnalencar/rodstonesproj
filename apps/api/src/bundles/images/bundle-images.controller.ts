import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { BundleImagesService } from './bundle-images.service';

import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CompanyRequired } from '../../auth/decorators/company-required.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@Controller('bundles/:bundleId/images')
export class BundleImagesController {
  constructor(
    private readonly bundleImagesService: BundleImagesService,
  ) {}

  @Post()
  @CompanyRequired()
  @Permissions('bundle:image:create')
  @UseInterceptors(FileInterceptor('image'))
  upload(
    @Param('bundleId', ParseIntPipe) bundleId: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bundleImagesService.upload(
      bundleId,
      file,
      user,
    );
  }

  @Get()
  @CompanyRequired()
  @Permissions('bundle:image:read')
  findAll(
    @Param('bundleId', ParseIntPipe) bundleId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bundleImagesService.findAll(
      bundleId,
      user,
    );
  }

  @Delete(':imageId')
  @CompanyRequired()
  @Permissions('bundle:image:delete')
  remove(
    @Param('bundleId', ParseIntPipe) bundleId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bundleImagesService.remove(
      bundleId,
      imageId,
      user,
    );
  }
}