
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

import { ClientsService } from './clients.service';

import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CompanyRequired } from '../auth/decorators/company-required.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';

import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('clients')
@CompanyRequired()
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
  ) {}

  @Post()
  @Permissions('client:create')
  create(
    @Body() dto: CreateClientDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clientsService.create(dto, user);
  }

  @Get()
  @Permissions('client:read')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clientsService.findAll(user);
  }

  @Get(':id')
  @Permissions('client:read')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clientsService.findOne(id, user);
  }

  @Patch(':id')
  @Permissions('client:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClientDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clientsService.update(
      id,
      dto,
      user,
    );
  }

  @Delete(':id')
  @Permissions('client:delete')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clientsService.remove(id, user);
  }
}