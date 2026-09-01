import { Test, TestingModule } from '@nestjs/testing';
import { CompanyMembershipsService } from './company-memberships.service';

describe('CompanyMembershipsService', () => {
  let service: CompanyMembershipsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyMembershipsService],
    }).compile();

    service = module.get<CompanyMembershipsService>(CompanyMembershipsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
