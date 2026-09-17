import { Type, Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDecimal,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CreateBundleDto {
  @Type(() => Number)
  @IsInt()
  materialId!: number;

  @Type(() => Number)
  @IsInt()
  materialTypeId!: number;

  @Type(() => Number)
  @IsInt()
  materialClassificationId!: number;

  @Type(() => Number)
  @IsInt()
  qualityId!: number;

  @Type(() => Number)
  @IsInt()
  finishId!: number;

  @IsString()
  @MaxLength(100)
  bundleCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  block?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @IsOptional()
  @IsDecimal()
  thickness?: string;

  @IsOptional()
  @IsDecimal()
  weight?: string;

  @IsOptional()
  @IsDecimal()
  basePrice?: string;

  @IsString()
  slabs!: string;
}