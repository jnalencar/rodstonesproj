import {
    Body,
    Controller,
    Post,
    Get,
} from '@nestjs/common';

import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CompanyRequired } from '../auth/decorators/company-required.decorator';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('partners')
export class PartnersController {
    constructor(
        private readonly partnersService: PartnersService,
    ) { }

    @Post('create')
    @Permissions('partner:create')
    create(@Body() dto: CreatePartnerDto) {
        return this.partnersService.create(dto);
    }

    @Get('list')
    @CompanyRequired()
    @Permissions('partner:read')
    findAll(@CurrentUser() user: AuthenticatedUser) {
        return this.partnersService.findAllByCompany(user);
    }
}