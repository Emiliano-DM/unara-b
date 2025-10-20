import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { Trip } from 'src/trips/entities/trip.entity';
import { Place } from 'src/places/entities/place.entity';
import { User } from 'src/users/entities/user.entity';
import { FilterActivityDto } from './dto/filter-activity.dto';
import { EventsGateway } from 'src/events/events.gateway';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,

    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,

    @InjectRepository(Place)
    private readonly placeRepository: Repository<Place>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly eventsGateway: EventsGateway,
  ) {}

  async create(dto: CreateActivityDto) {
    const { tripId, placeId, userId, ...activityData } = dto;

    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) throw new NotFoundException(`Trip with id ${tripId} not found`);

    let place: Place | null = null;
    if (placeId) {
      place = await this.placeRepository.findOne({ where: { id: placeId } });
      if (!place) throw new NotFoundException(`Place with id ${placeId} not found`);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);

    const activity = this.activityRepository.create({
      ...activityData,
      trip,
      ...(place ? { place } : {}),
      user: user,
    });

    await this.activityRepository.save(activity);

    // Emit WebSocket event
    this.eventsGateway.emitActivityAdded(tripId, userId, {
      activityId: activity.id,
      name: activity.name,
      date: activity.date,
      placeId: activity.place?.id,
      description: activity.description,
    });

    return activity;
  }

  async findAll(dto: FilterActivityDto) {
    const { limit = 10, offset = 0, tripId, placeId, userId, name } = dto;

    const query = this.activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.trip', 'trip')
      .leftJoinAndSelect('activity.place', 'place')
      .leftJoinAndSelect('activity.user', 'user');

    if (tripId) query.andWhere('activity.tripId = :tripId', { tripId });
    if (placeId) query.andWhere('activity.placeId = :placeId', { placeId });
    if (userId) query.andWhere('activity.userId = :userId', { userId });
    if (name) query.andWhere('activity.name ILIKE :name', { name: `%${name}%` });

    query.skip(offset).take(limit);

    return query.getMany();
  }

  async findOne(id: string) {
    const activity = await this.activityRepository.findOne({
      where: { id },
      relations: ['trip', 'place', 'user'],
    });

    if (!activity) throw new NotFoundException(`Activity with id ${id} not found`);
    return activity;
  }

  async update(id: string, dto: UpdateActivityDto) {
    const { tripId, placeId, userId, ...activityData } = dto;

    let trip: Trip | null = null;
    if (tripId) {
      trip = await this.tripRepository.findOne({ where: { id: tripId } });
      if (!trip) throw new NotFoundException(`Trip with id ${tripId} not found`);
    }

    let place: Place | null = null;
    if (placeId) {
      place = await this.placeRepository.findOne({ where: { id: placeId } });
      if (!place) throw new NotFoundException(`Place with id ${placeId} not found`);
    }

    let user: User | null = null;
    if (userId) {
      user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    }

    const activity = await this.activityRepository.preload({
      id,
      ...activityData,
      ...(trip ? { trip } : {}),
      ...(place ? { place } : {}),
      ...(user ? { user: user } : {}),
    });

    if (!activity) throw new NotFoundException(`Activity with id ${id} not found`);

    try {
      await this.activityRepository.save(activity);

      // Emit WebSocket event
      const finalTripId = trip?.id || activity.trip?.id;
      const finalUserId = user?.id || activity.user?.id;

      if (finalTripId && finalUserId) {
        this.eventsGateway.emitActivityUpdated(finalTripId, finalUserId, {
          activityId: activity.id,
          name: activity.name,
          date: activity.date,
          placeId: activity.place?.id,
          description: activity.description,
        });
      }
    } catch (error) {
      throw new InternalServerErrorException('Error updating activity');
    }

    return activity;
  }

  async remove(id: string) {
    const activity = await this.activityRepository.findOne({
      where: { id },
      relations: { trip: true, user: true, place: true }
    });
    if (!activity) throw new NotFoundException(`Activity with id ${id} not found`);

    const activityData = {
      activityId: activity.id,
      name: activity.name,
      date: activity.date,
      placeId: activity.place?.id,
    };

    await this.activityRepository.remove(activity);

    // Emit WebSocket event
    if (activity.trip?.id && activity.user?.id) {
      this.eventsGateway.emitActivityRemoved(activity.trip.id, activity.user.id, activityData);
    }

    return { message: `Activity with id ${id} has been removed` };
  }
}
