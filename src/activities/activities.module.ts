import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { Trip } from 'src/trips/entities/trip.entity';
import { Place } from 'src/places/entities/place.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  imports: [
    TypeOrmModule.forFeature([ 
      Activity, 
      Trip, 
      Place,
      User,
    ])
  ]
})
export class ActivitiesModule {}
