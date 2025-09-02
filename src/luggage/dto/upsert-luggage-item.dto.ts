import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpsertLuggageItemDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}
