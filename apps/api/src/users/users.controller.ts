import { Controller, Get, Param, ParseIntPipe, Patch, Body, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CompanyRequired } from '../auth/decorators/company-required.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) { }

  @Get('list')
  @CompanyRequired()
  @Permissions('user:read')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.findAll(user);
  }

  @Get(':id')
  @Permissions('user:read')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.findOne(id, user);
  }

  @Patch(':id')
  @Permissions('user:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Delete(':id')
  @Permissions('user:delete')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.remove(id, user);
  }
}