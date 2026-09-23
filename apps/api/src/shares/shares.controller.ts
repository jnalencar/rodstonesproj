import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { SharesService } from './shares.service';

import { CreateShareDto } from './dto/create-share.dto';

import { CompanyRequired } from '../auth/decorators/company-required.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';

import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('shares')
export class SharesController {
  constructor(
    private readonly sharesService: SharesService,
  ) {}

  @Post()
  @CompanyRequired()
  @Permissions('share:create')
  create(
    @Body() dto: CreateShareDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sharesService.create(dto, user);
  }

  @Get()
  @CompanyRequired()
  @Permissions('share:read')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sharesService.findAll(user);
  }

  @Get(':token')
  @Public()
  findPublic(
    @Param('token') token: string,
  ) {
    return this.sharesService.findPublicByToken(
      token,
    );
  }
}