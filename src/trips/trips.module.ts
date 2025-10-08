import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './entities/trip.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  controllers: [TripsController],
  providers: [TripsService],
  imports: [
    TypeOrmModule.forFeature([ Trip, User ])
  ]
})
export class TripsModule {}
