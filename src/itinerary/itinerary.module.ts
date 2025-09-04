import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItineraryService } from './itinerary.service';
import { Itinerary } from './entities/itinerary.entity';
import { ItineraryDay } from './entities/itinerary-day.entity';
import { ItineraryActivity } from './entities/itinerary-activity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Itinerary, ItineraryDay, ItineraryActivity]),
  ],
  providers: [ItineraryService],
  exports: [ItineraryService],
})
export class ItineraryModule {}