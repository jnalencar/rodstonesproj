import { Injectable } from '@nestjs/common';
import { CreateCompanyMembershipDto } from './dto/create-company-membership.dto';
import { UpdateCompanyMembershipDto } from './dto/update-company-membership.dto';

@Injectable()
export class CompanyMembershipsService {
  create(createCompanyMembershipDto: CreateCompanyMembershipDto) {
    return 'This action adds a new companyMembership';
  }

  findAll() {
    return `This action returns all companyMemberships`;
  }

  findOne(id: number) {
    return `This action returns a #${id} companyMembership`;
  }

  update(id: number, updateCompanyMembershipDto: UpdateCompanyMembershipDto) {
    return `This action updates a #${id} companyMembership`;
  }

  remove(id: number) {
    return `This action removes a #${id} companyMembership`;
  }
}
