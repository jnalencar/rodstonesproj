import {
    Body,
    Controller,
    Post,
    Get,
} from '@nestjs/common';

import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';

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
    @Permissions('partner:read')
    findAll() {
        return this.partnersService.findAll();
    }
}