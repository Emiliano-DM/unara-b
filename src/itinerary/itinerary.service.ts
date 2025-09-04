import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Itinerary } from './entities/itinerary.entity';
import { ItineraryDay } from './entities/itinerary-day.entity';
import { ItineraryActivity } from './entities/itinerary-activity.entity';
import { CreateItineraryDayDto } from './dto/create-itinerary-day.dto';

@Injectable()
export class ItineraryService {
  constructor(
    @InjectRepository(Itinerary)
    private itineraryRepository: Repository<Itinerary>,
    @InjectRepository(ItineraryDay)
    private itineraryDayRepository: Repository<ItineraryDay>,
    @InjectRepository(ItineraryActivity)
    private itineraryActivityRepository: Repository<ItineraryActivity>,
  ) {}

  async createItinerary(
    tripId: string,
    itineraryDays: CreateItineraryDayDto[],
  ): Promise<Itinerary> {
    // Create the main itinerary
    const itinerary = this.itineraryRepository.create({
      trip: { id: tripId },
    });

    const savedItinerary = await this.itineraryRepository.save(itinerary);

    // Create days and activities
    for (const dayDto of itineraryDays) {
      const day = this.itineraryDayRepository.create({
        ...dayDto,
        date: new Date(dayDto.date),
        itinerary: savedItinerary,
      });

      const savedDay = await this.itineraryDayRepository.save(day);

      // Create activities if provided
      if (dayDto.activities?.length > 0) {
        const activities = dayDto.activities.map(activityDto =>
          this.itineraryActivityRepository.create({
            ...activityDto,
            day: savedDay,
          }),
        );

        await this.itineraryActivityRepository.save(activities);
      }
    }

    return this.findOne(savedItinerary.id);
  }

  async findOne(id: string): Promise<Itinerary> {
    const itinerary = await this.itineraryRepository.findOne({
      where: { id },
      relations: [
        'days',
        'days.activities',
        'trip',
      ],
    });

    if (!itinerary) {
      throw new NotFoundException('Itinerary not found');
    }

    return itinerary;
  }

  async updateActivity(activityData: any): Promise<any> {
    // TODO: Implement activity update logic
    // This would be used by the WebSocket gateway
    return activityData;
  }
}