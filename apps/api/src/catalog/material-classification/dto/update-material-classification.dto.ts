import { PartialType } from '@nestjs/mapped-types';
import { CreateMaterialClassificationDto } from './create-material-classification.dto';

export class UpdateMaterialClassificationDto extends PartialType(CreateMaterialClassificationDto) {}