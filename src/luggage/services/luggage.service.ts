import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Luggage } from '../entities/luggage.entity';
import { CreateLuggageDto } from '../dto/create-luggage.dto';
import { FilterLuggageDto } from '../dto/filter-luggage.dto';
import { UpdateLuggageDto } from '../dto/update-luggage.dto';
import { Trip } from 'src/trips/entities/trip.entity';
import { User } from 'src/users/entities/user.entity';
import { EventsGateway } from 'src/events/events.gateway';

@Injectable()
export class LuggageService {

  constructor(
    @InjectRepository(Luggage)
    private readonly luggageRepository: Repository<Luggage>,

    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly eventsGateway: EventsGateway,
  ){}

  async create(dto: CreateLuggageDto) {
    const { tripId, userId, ...luggageData } = dto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    let trip: Trip | null = null;
    if (tripId) {
      trip = await this.tripRepository.findOne({ where: { id: tripId } });
      if (!trip) {
        throw new NotFoundException(`Trip with id ${tripId} not found`);
      }
    }

    const luggage = this.luggageRepository.create({
      ...luggageData,
      user,
      ...(trip ? { trip } : {}),
    });

    await this.luggageRepository.save(luggage);

    // Emit WebSocket event if luggage is linked to a trip
    if (trip) {
      this.eventsGateway.emitLuggageCreated(trip.id, user.id, {
        luggageId: luggage.id,
        name: luggage.name,
        is_shared: luggage.is_shared || false,
        userId: user.id,
      });
    }

    return luggage;
  }

  async findAll(dto: FilterLuggageDto) {
    const { 
      limit = 10, 
      offset = 0,
      name,
      tripId,
      userId,
    } = dto;

    const query = this.luggageRepository
                    .createQueryBuilder('luggage')
                    .leftJoinAndSelect('luggage.user', 'user')
                    .leftJoinAndSelect('luggage.trip', 'trip');

    if (name) {
      query.andWhere('luggage.name ILIKE :name', { name: `%${name}%` });
    }

    if (tripId) {
      query.andWhere('trip.id = :tripId', { tripId });
    }

    if (userId) {
      query.andWhere('user.id = :userId', { userId });
    }

    query.skip(offset).take(limit);

    return query.getMany();
  }

  async findOne(id: string) {
    const luggage = await this.luggageRepository.findOne({
      where: { id },
      relations: ['trip', 'user'],
    });

    if (!luggage) {
      throw new NotFoundException(`Luggage with id ${id} not found`);
    }

    return luggage;
  }

  async update(id: string, updateLuggageDto: UpdateLuggageDto) {
    const { tripId, userId, ...luggageData } = updateLuggageDto;

    let trip: Trip | null = null;
    if (tripId) {
      trip = await this.tripRepository.findOne({ where: { id: tripId } });
      if (!trip) throw new NotFoundException(`Trip with id ${tripId} not found`);
    }

    let user: User | null = null;
    if (userId) {
      user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    }

    const luggage = await this.luggageRepository.preload({
      id,
      ...luggageData,
      ...(trip ? { trip } : {}),
      ...(user ? { user } : {}),
    });

    if (!luggage) {
      throw new NotFoundException(`Luggage with id ${id} not found`);
    }

    await this.luggageRepository.save(luggage);

    // Emit WebSocket event if luggage is linked to a trip
    if (luggage.trip) {
      this.eventsGateway.emitLuggageUpdated(luggage.trip.id, luggage.user.id, {
        luggageId: luggage.id,
        name: luggage.name,
        is_shared: luggage.is_shared || false,
        userId: luggage.user.id,
      });
    }

    return luggage;
  }

  async remove(id: string) {
    const luggage = await this.luggageRepository.findOneBy({ id: id })

    if (!luggage){
      throw new NotFoundException(`Luggage with id ${id} not found`)
    }

    this.luggageRepository.remove(luggage)
    return { message: `Luggage with id ${id} has been removed` };
  }
}
