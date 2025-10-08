import { Module } from '@nestjs/common';
import { PlacesService } from './places.service';
import { PlacesController } from './places.controller';
import { Place } from './entities/place.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from 'src/trips/entities/trip.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  controllers: [PlacesController],
  providers: [PlacesService],
  imports: [
    TypeOrmModule.forFeature([ 
      Place, 
      Trip, 
      User 
    ])
  ]
})
export class PlacesModule {}
