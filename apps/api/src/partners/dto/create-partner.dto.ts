import { IsEmail, IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PartnerType } from 'generated/prisma/enums';

export class CreatePartnerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @IsEnum(PartnerType)
  type!: PartnerType;

  @IsOptional()
  @IsInt()
  companyId?: number;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}