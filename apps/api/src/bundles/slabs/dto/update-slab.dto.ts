import { PartialType } from '@nestjs/mapped-types';
import { CreateSlabDto } from './create-slab.dto';

export class UpdateSlabDto extends PartialType(CreateSlabDto) {}