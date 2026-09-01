import { Test, TestingModule } from '@nestjs/testing';
import { CompanyMembershipsController } from './company-memberships.controller';
import { CompanyMembershipsService } from './company-memberships.service';

describe('CompanyMembershipsController', () => {
  let controller: CompanyMembershipsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyMembershipsController],
      providers: [CompanyMembershipsService],
    }).compile();

    controller = module.get<CompanyMembershipsController>(CompanyMembershipsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
