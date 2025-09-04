import { IsString, IsNotEmpty, IsOptional, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CoordinatesDto {
  lat: number;
  lng: number;
}

export class CreateItineraryActivityDto {
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Start time must be in HH:MM format' })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'End time must be in HH:MM format' })
  endTime?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
}