import { IsDate, IsOptional, IsString, IsUUID, MaxLength } from "class-validator"
import { Type } from "class-transformer"
import { PaginationDto } from "src/common/dto/pagination.dto"

export class FilterActivityDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFrom?: Date

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateTo?: Date

  @IsOptional()
  @IsUUID()
  tripId?: string

  @IsOptional()
  @IsUUID()
  placeId?: string

  @IsOptional()
  @IsUUID()
  userId?: string
}
