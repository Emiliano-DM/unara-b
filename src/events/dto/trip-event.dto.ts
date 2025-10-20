import { IsString, IsNotEmpty, IsUUID, IsDate, IsObject, IsOptional, IsEnum } from 'class-validator';
import { TripEventType } from '../interfaces/trip-events.interface';

export class TripEventDto {
  @IsEnum(TripEventType)
  @IsNotEmpty()
  type: TripEventType;

  @IsUUID()
  @IsNotEmpty()
  tripId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsDate()
  @IsNotEmpty()
  timestamp: Date;

  @IsObject()
  @IsNotEmpty()
  data: any;
}

export class JoinTripRoomDto {
  @IsUUID()
  @IsNotEmpty()
  tripId: string;
}

export class LeaveTripRoomDto {
  @IsUUID()
  @IsNotEmpty()
  tripId: string;
}
