import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CompanyRequired } from '../../auth/decorators/company-required.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { FinishService } from './finish.services';
import { CreateFinishDto } from './dto/create-finish.dto';
import { UpdateFinishDto } from './dto/update-finish.dto';

@Controller('finishes')
export class FinishController {
  constructor(
    private readonly finishService: FinishService,
  ) {}

  @Post()
  @CompanyRequired()
  @Permissions('finish:create')
  create(
    @Body() dto: CreateFinishDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.finishService.create(dto, user);
  }

  @Get()
  @CompanyRequired()
  @Permissions('finish:read')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.finishService.findAll(user);
  }

  @Get(':id')
  @CompanyRequired()
  @Permissions('finish:read')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.finishService.findOne(id, user);
  }

  @Patch(':id')
  @CompanyRequired()
  @Permissions('finish:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFinishDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.finishService.update(id, dto, user);
  }

  @Delete(':id')
  @CompanyRequired()
  @Permissions('finish:delete')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.finishService.remove(id, user);
  }
}