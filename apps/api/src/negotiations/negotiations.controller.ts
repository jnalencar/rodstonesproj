import {
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Body,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { NegotiationsService } from './negotiations.service';
import type { NegotiationUploadFile } from './negotiations.service';

import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { CompanyRequired } from 'src/auth/decorators/company-required.decorator';
import { CreateNegotiationDto } from './dto/create-negotiation.dto';
import { UpdateNegotiationDto } from './dto/update-negotiation.dto';

@Controller('negotiations')
export class NegotiationsController {
    constructor(
        private readonly negotiationsService: NegotiationsService,
    ) { }

    @Post()
    @CompanyRequired()
    @Permissions('negotiation:create')
    create(
        @Body() dto: CreateNegotiationDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.negotiationsService.create(dto, user);
    }

    @Get()
    @CompanyRequired()
    @Permissions('negotiation:read')
    findAll(
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.negotiationsService.findAll(user);
    }

    @Get(':id')
    @CompanyRequired()
    @Permissions('negotiation:read')
    findOne(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.negotiationsService.findOne(id, user);
    }

    @Patch(':id')
    @CompanyRequired()
    @Permissions('negotiation:update')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateNegotiationDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.negotiationsService.update(id, dto, user);
    }

    @Post(':id/files')
    @CompanyRequired()
    @Permissions('negotiation:update')
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(
        @Param('id', ParseIntPipe) id: number,
        @UploadedFile() file: NegotiationUploadFile,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.negotiationsService.uploadFile(id, file, user);
    }

    @Delete(':id/files/:fileId')
    @CompanyRequired()
    @Permissions('negotiation:update')
    deleteFile(
        @Param('id', ParseIntPipe) id: number,
        @Param('fileId', ParseIntPipe) fileId: number,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.negotiationsService.deleteFile(id, fileId, user);
    }
}