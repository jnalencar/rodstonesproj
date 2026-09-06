import { Test, TestingModule } from '@nestjs/testing';
import { PartnerCompaniesService } from './partner-companies.service';

describe('PartnerCompaniesService', () => {
  let service: PartnerCompaniesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PartnerCompaniesService],
    }).compile();

    service = module.get<PartnerCompaniesService>(PartnerCompaniesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
