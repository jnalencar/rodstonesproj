import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { BundlesService } from './bundles.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { UpdateBundleDto } from './dto/update-bundle.dto';

import { CompanyRequired } from '../auth/decorators/company-required.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('bundles')
export class BundlesController {
  constructor(
    private readonly bundlesService: BundlesService,
  ) {}

  @Post('create')
  @CompanyRequired()
  @Permissions('bundle:create')
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateBundleDto,
    @UploadedFile() image: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bundlesService.create(dto, image, user);
  }

  @Get('list')
  @CompanyRequired()
  @Permissions('bundle:read')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bundlesService.findAll(user);
  }

  @Get(':id')
  @CompanyRequired()
  @Permissions('bundle:read')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bundlesService.findOne(id, user);
  }

  @Patch(':id')
  @CompanyRequired()
  @Permissions('bundle:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBundleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bundlesService.update(id, dto, user);
  }

  @Delete(':id')
  @CompanyRequired()
  @Permissions('bundle:delete')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.bundlesService.remove(id, user);
  }
}