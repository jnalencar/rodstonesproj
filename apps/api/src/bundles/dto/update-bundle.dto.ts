import { PartialType } from '@nestjs/mapped-types';
import { CreateBundleDto } from './create-bundle.dto';
import { OmitType } from '@nestjs/mapped-types';

export class UpdateBundleDto extends PartialType(
  OmitType(CreateBundleDto, ['slabs'] as const),
) {}