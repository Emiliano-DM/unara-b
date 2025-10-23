import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";

export class UpsertLuggageItemDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsBoolean()
  @IsOptional()
  packed?: boolean;
}
