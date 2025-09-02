import { IsOptional, IsString, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterTripDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDateFrom?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDateTo?: Date;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isOwner?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isParticipant?: boolean;
}
