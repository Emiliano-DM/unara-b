import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Place } from './entities/place.entity';
import { Repository } from 'typeorm';
import { Trip } from 'src/trips/entities/trip.entity';
import { FilterPlaceDto } from './dto/filter-place.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class PlacesService {

  constructor(
    @InjectRepository(Place)
    private readonly placeRepository: Repository<Place>,

    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ){}

  async create(dto: CreatePlaceDto) {
      const { tripId, userId, ...placeData } = dto;

      const trip = await this.tripRepository.findOne({ where: { id: tripId } });
      if (!trip) {
          throw new NotFoundException(`Trip with id ${tripId} not found`);
      }

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
          throw new NotFoundException(`User with id ${userId} not found`);
      }

      const place = this.placeRepository.create({
          ...placeData,
          trip,
          user
      });

      await this.placeRepository.save(place);
      return place;
  }

  async findAll(dto: FilterPlaceDto) {
      const { 
          limit = 10, 
          offset = 0,
          name,
          description,
          userId,
          tripId,
      } = dto;

      const query = this.placeRepository
          .createQueryBuilder('place')
          .leftJoinAndSelect('place.trip', 'trip')
          .leftJoinAndSelect('place.user', 'user');

      if (tripId) query.andWhere('place.tripId = :tripId', { tripId });
      if (name) query.andWhere('place.name ILIKE :name', { name: `%${name}%` });
      if (description) query.andWhere('place.description ILIKE :description', { description: `%${description}%` });
      if (userId) query.andWhere('place.userId = :userId', { userId });

      query.skip(offset).take(limit);

      return query.getMany();
  }
  
  async findOne(id: string) {
      const place = await this.placeRepository.findOne({
          where: { id: id },
          relations: ['trip', 'user', 'activities'],
      });

      if (!place) {
          throw new NotFoundException(`Place with id ${id} not found`);
      }

      return place;
  }

  async update(id: string, dto: UpdatePlaceDto) {
    const { tripId, userId, ...placeData } = dto;

    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) throw new NotFoundException(`Trip with id ${tripId} not found`);

    let user: User | null = null;
    if (userId) {
      user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    }

    const place = await this.placeRepository.preload({
      id,
      ...placeData,
      trip,
      ...(user ? { user } : {}),
    });

    if (!place) throw new NotFoundException(`Place with id ${id} not found`);

    try {
      await this.placeRepository.save(place);
    } catch (error) {
      throw new InternalServerErrorException('Error updating place');
    }

    return place;
  }
  
  async remove(id: string) {
    const place = await this.placeRepository.findOneBy({ id });

    if (!place) {
      throw new NotFoundException(`Place with id ${id} not found`);
    }

    await this.placeRepository.remove(place);
    return { message: `Place with id ${id} has been removed` };
  }
}
