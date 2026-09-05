import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
} from 'class-validator';

export class UpdateMembershipRolesDto {
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  roles!: string[];
}