import { IsInt, IsNotEmpty } from 'class-validator';

export class CreatePartnerCompanyDto {
  @IsInt()
  @IsNotEmpty()
  partnerId!: number;

  @IsInt()
  @IsNotEmpty()
  companyId!: number;
}