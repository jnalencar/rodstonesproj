import { SetMetadata } from '@nestjs/common';

export const COMPANY_REQUIRED_KEY = 'companyRequired';

export const CompanyRequired = () =>
  SetMetadata(COMPANY_REQUIRED_KEY, true);