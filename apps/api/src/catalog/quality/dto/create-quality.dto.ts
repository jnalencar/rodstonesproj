import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateQualityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}