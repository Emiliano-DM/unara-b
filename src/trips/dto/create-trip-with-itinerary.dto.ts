import { 
  IsString, 
  IsNotEmpty, 
  MaxLength, 
  IsOptional, 
  IsDateString, 
  IsNumber, 
  Min, 
  Max, 
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateItineraryDayDto } from '../../itinerary/dto/create-itinerary-day.dto';

export class CreateTripWithItineraryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  maxParticipants?: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateItineraryDayDto)
  itineraryDays?: CreateItineraryDayDto[];
}