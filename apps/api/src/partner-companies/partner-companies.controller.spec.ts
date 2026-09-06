import { Test, TestingModule } from '@nestjs/testing';
import { PartnerCompaniesController } from './partner-companies.controller';

describe('PartnerCompaniesController', () => {
  let controller: PartnerCompaniesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PartnerCompaniesController],
    }).compile();

    controller = module.get<PartnerCompaniesController>(PartnerCompaniesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
