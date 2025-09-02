import { PartialType } from '@nestjs/mapped-types';
import { CreateLuggageCategoryDto } from './create-luggage-category.dto';

export class UpdateLuggageCategoryDto extends PartialType(
  CreateLuggageCategoryDto,
) {}
