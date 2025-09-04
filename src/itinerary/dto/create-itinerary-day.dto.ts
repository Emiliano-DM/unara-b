import { IsString, IsNotEmpty, IsOptional, IsDateString, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateItineraryActivityDto } from './create-itinerary-activity.dto';

export class CreateItineraryDayDto {
  @IsDateString()
  date: string;

  @IsInt()
  @Min(1)
  dayNumber: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateItineraryActivityDto)
  activities?: CreateItineraryActivityDto[];
}