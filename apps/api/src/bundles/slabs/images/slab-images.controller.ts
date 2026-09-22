import {
    Controller,
    Param,
    ParseIntPipe,
    Post,
    UploadedFile,
    UseInterceptors,
    Delete,
    Get,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { SlabImagesService } from './slab-images.service';

import { AuthenticatedUser } from '../../../auth/interfaces/authenticated-user.interface';

import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { CompanyRequired } from '../../../auth/decorators/company-required.decorator';
import { Permissions } from '../../../auth/decorators/permissions.decorator';

@Controller('bundles/:bundleId/slabs/:slabId/images')
export class SlabImagesController {
    constructor(
        private readonly slabImagesService: SlabImagesService,
    ) { }

    @Post()
    @CompanyRequired()
    @Permissions('slab:image:create')
    @UseInterceptors(FileInterceptor('image'))
    upload(
        @Param('bundleId', ParseIntPipe) bundleId: number,
        @Param('slabId', ParseIntPipe) slabId: number,
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.slabImagesService.upload(
            bundleId,
            slabId,
            file,
            user,
        );
    }

    @Delete(':imageId')
    @CompanyRequired()
    @Permissions('slab:image:delete')
    remove(
        @Param('bundleId', ParseIntPipe) bundleId: number,
        @Param('slabId', ParseIntPipe) slabId: number,
        @Param('imageId', ParseIntPipe) imageId: number,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.slabImagesService.remove(
            bundleId,
            slabId,
            imageId,
            user,
        );
    }

    @Get()
    @CompanyRequired()
    @Permissions('slab:image:read')
    findAll(
        @Param('bundleId', ParseIntPipe) bundleId: number,
        @Param('slabId', ParseIntPipe) slabId: number,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.slabImagesService.findAll(
            bundleId,
            slabId,
            user,
        );
    }
}