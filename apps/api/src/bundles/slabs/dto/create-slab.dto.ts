import { Type } from 'class-transformer';
import {
  IsDecimal,
  IsInt,
  IsPositive,
} from 'class-validator';

export class CreateSlabDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  number!: number;

  @IsDecimal()
  length!: string;

  @IsDecimal()
  height!: string;
}