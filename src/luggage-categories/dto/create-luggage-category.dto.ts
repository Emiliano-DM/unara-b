import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLuggageCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsString()
  @IsNotEmpty()
  image: string;
}
