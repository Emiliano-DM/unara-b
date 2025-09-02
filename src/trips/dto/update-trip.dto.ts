import { PartialType } from '@nestjs/mapped-types';
import { CreateTripDto } from './create-trip.dto';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateTripDto extends PartialType(CreateTripDto) {
  @IsOptional()
  @IsString()
  @IsIn(['planning', 'active', 'completed', 'cancelled'])
  status?: string;
}
