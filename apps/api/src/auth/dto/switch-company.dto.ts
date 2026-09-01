import { IsInt, Min } from 'class-validator';

export class SwitchCompanyDto {
  @IsInt()
  @Min(1)
  companyId!: number;
}