import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Put } from '@nestjs/common';
import { CompanyMembershipsService } from './company-memberships.service';
import { CreateCompanyMembershipDto } from './dto/create-company-membership.dto';
import { UpdateCompanyMembershipDto } from './dto/update-company-membership.dto';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CompanyRequired } from '../auth/decorators/company-required.decorator';
import { UpdateMembershipRolesDto } from './dto/update-membership-roles.dto';

@Controller('company-memberships')
export class CompanyMembershipsController {
  constructor(private readonly companyMembershipsService: CompanyMembershipsService) { }

  @Post('create')
  @CompanyRequired()
  @Permissions('membership:create')
  create(
    @Body() dto: CreateCompanyMembershipDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyMembershipsService.create(dto, user);
  }

  @Get('list')
  @CompanyRequired()
  @Permissions('membership:read')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyMembershipsService.findAll(user);
  }

  @Get(':id')
  @CompanyRequired()
  @Permissions('membership:read')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyMembershipsService.findOne(id, user);
  }

  @Patch(':id')
  @CompanyRequired()
  @Permissions('membership:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyMembershipDto,
  ) {
    return this.companyMembershipsService.update(id, dto);
  }

  @Delete(':id')
  @CompanyRequired()
  @Permissions('membership:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.companyMembershipsService.remove(id);
  }

  @Patch(':id/roles')
  @CompanyRequired()
  @Permissions('membership:roles')
  updateRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMembershipRolesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyMembershipsService.updateRoles(id, dto, user);
  }
}
