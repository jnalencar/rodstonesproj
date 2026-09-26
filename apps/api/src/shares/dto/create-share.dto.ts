import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShareDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsInt()
  @Type(() => Number)
  clientId!: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  bundleIds!: number[];
}