import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePartnerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @IsEnum(['THERODSTONES', 'OTHER'])  //(['RESELLER', 'INTEGRATOR', 'OTHER']) pós migration
  type!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}