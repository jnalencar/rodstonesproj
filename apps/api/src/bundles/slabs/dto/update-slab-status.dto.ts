import { IsEnum } from 'class-validator';

import { SlabStatus } from '../../../../generated/prisma/client';

export class UpdateSlabStatusDto {
  @IsEnum(SlabStatus)
  status!: SlabStatus;
}