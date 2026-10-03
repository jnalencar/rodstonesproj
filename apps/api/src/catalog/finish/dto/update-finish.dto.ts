import { PartialType } from '@nestjs/mapped-types';
import { CreateFinishDto } from './create-finish.dto';

export class UpdateFinishDto extends PartialType(CreateFinishDto) {}