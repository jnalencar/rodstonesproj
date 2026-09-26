import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReservationRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  slabIds!: number[];
}