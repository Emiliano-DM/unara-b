import { Module } from '@nestjs/common';
import { PlacesService } from './places.service';
import { PlacesController } from './places.controller';
import { Place } from './entities/place.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from 'src/trips/entities/trip.entity';
import { User } from 'src/users/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { EventsModule } from 'src/events/events.module';

@Module({
  controllers: [PlacesController],
  providers: [PlacesService],
  imports: [
    TypeOrmModule.forFeature([
      Place,
      Trip,
      User
    ]),
    AuthModule,
    EventsModule
  ]
})
export class PlacesModule {}
