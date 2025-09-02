import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { Trip } from './entities/trip.entity';
import { TripParticipant } from './entities/trip-participant.entity';
import { User } from '../users/entities/user.entity';
import { ItemsModule } from '../items/items.module';
import { LuggageModule } from '../luggage/luggage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, TripParticipant, User]),
    forwardRef(() => ItemsModule),
    forwardRef(() => LuggageModule),
  ],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
