import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { CompanyMembershipsService } from './company-memberships.service';
import { CreateCompanyMembershipDto } from './dto/create-company-membership.dto';
import { UpdateCompanyMembershipDto } from './dto/update-company-membership.dto';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';
import { CompanyContextGuard } from 'src/auth/guards/company-context.guard';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('company-memberships')
export class CompanyMembershipsController {
  constructor(private readonly companyMembershipsService: CompanyMembershipsService) { }

  @Post('create')
  @UseGuards(
    JwtAuthGuard,
    CompanyContextGuard,
    PermissionsGuard,
  )
  @Permissions('membership:create')
  create(
    @Body() dto: CreateCompanyMembershipDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyMembershipsService.create(dto, user);
  }

  @Get('list')
  @UseGuards(
    JwtAuthGuard,
    CompanyContextGuard,
    PermissionsGuard,
  )
  @Permissions('membership:read')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyMembershipsService.findAll(user);
  }

  @Get(':id')
  @UseGuards(
    JwtAuthGuard,
    CompanyContextGuard,
    PermissionsGuard,
  )
  @Permissions('membership:read')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyMembershipsService.findOne(id, user);
  }

  @Patch('memberships/:id')
  @UseGuards(JwtAuthGuard, CompanyContextGuard, PermissionsGuard)
  @Permissions('membership:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyMembershipDto,
  ) {
    return this.companyMembershipsService.update(id, dto);
  }

  @Delete('memberships/:id/delete')
  @UseGuards(JwtAuthGuard, CompanyContextGuard, PermissionsGuard)
  @Permissions('membership:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.companyMembershipsService.remove(id);
  }
}
