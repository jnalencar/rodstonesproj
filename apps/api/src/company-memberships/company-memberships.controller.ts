import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CompanyMembershipsService } from './company-memberships.service';
import { CreateCompanyMembershipDto } from './dto/create-company-membership.dto';
import { UpdateCompanyMembershipDto } from './dto/update-company-membership.dto';

@Controller('company-memberships')
export class CompanyMembershipsController {
  constructor(private readonly companyMembershipsService: CompanyMembershipsService) {}

  @Post()
  create(@Body() createCompanyMembershipDto: CreateCompanyMembershipDto) {
    return this.companyMembershipsService.create(createCompanyMembershipDto);
  }

  @Get()
  findAll() {
    return this.companyMembershipsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companyMembershipsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCompanyMembershipDto: UpdateCompanyMembershipDto) {
    return this.companyMembershipsService.update(+id, updateCompanyMembershipDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.companyMembershipsService.remove(+id);
  }
}
