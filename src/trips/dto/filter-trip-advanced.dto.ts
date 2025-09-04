import { IsOptional, IsEnum, IsDateString, IsString, IsBoolean } from 'class-validator';
import { TripStatus } from '../../common/enums/trip-status.enum';

export class FilterTripAdvancedDto {
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @IsOptional()
  @IsString()
  search?: string; // Search in name, destination, description

  @IsOptional()
  @IsBoolean()
  onlyMyTrips?: boolean;

  // Pagination
  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}