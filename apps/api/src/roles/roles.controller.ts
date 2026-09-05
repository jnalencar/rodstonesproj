import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CompanyRequired } from 'src/auth/decorators/company-required.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';

@Controller('roles')
export class RolesController {
    constructor(
        private readonly rolesService: RolesService,
    ) { }

    @Get('list')
    @CompanyRequired()
    @Permissions('role:read')
    findAll(
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.rolesService.findAll(user);
    }

    @Get(':id')
    @Permissions('role:read')
    findOne(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.rolesService.findOne(id, user);
    }

    @Post('create')
    @CompanyRequired()
    @Permissions('role:create')
    create(
        @Body() dto: CreateRoleDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.rolesService.create(dto, user);
    }

    @Patch(':id')
    @Permissions('role:update')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateRoleDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.rolesService.update(id, dto, user);
    }
}