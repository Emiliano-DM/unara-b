import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateLuggageDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;
}
