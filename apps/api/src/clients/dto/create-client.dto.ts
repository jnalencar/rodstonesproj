import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateClientDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  document?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}