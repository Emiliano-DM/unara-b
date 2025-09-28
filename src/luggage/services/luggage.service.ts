import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Luggage } from '../entities/luggage.entity';
import { CreateLuggageDto } from '../dto/create-luggage.dto';
import { FilterLuggageDto } from '../dto/filter-luggage.dto';
import { UpdateLuggageDto } from '../dto/update-luggage.dto';
import { Trip } from 'src/trips/entities/trip.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class LuggageService {
  
  constructor(
    @InjectRepository(Luggage)
    private readonly luggageRepository: Repository<Luggage>,

    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ){}


  async create(dto: CreateLuggageDto) {
    const { tripId, userIds, ...luggageData } = dto;

    const users = await this.userRepository.find({
      where: { id: In(userIds) }  
    });

    if (users.length !== userIds.length) {
      throw new NotFoundException("Some users not found");
    }

    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    
    if (!trip) throw new NotFoundException(`Trip with id ${tripId} not found`);

    const luggage = this.luggageRepository.create({
      ...luggageData,
      trip: trip,
      users: users,
    })
    
    await this.luggageRepository.save(luggage)
    return luggage
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
                    .leftJoinAndSelect('luggage.users', 'user')
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
      relations: ['trip', 'users'],
    });

    if (!luggage) {
      throw new NotFoundException(`Luggage with id ${id} not found`);
    }

    return luggage;
  }

  async update(id: string, updateLuggageDto: UpdateLuggageDto) {
    const { tripId, userIds, ...luggageData } = updateLuggageDto;

    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) throw new NotFoundException(`Trip with id ${tripId} not found`);

    let users: User[] | null = null;
    if (userIds) {
      users = await this.userRepository.find({
        where: { id: In(userIds) }
      });

      if (users.length !== userIds.length) {
        throw new NotFoundException("Some users not found");
      }
    }

    const luggage = await this.luggageRepository.preload({
      id,
      ...luggageData,
      trip,
      ...(users ? { users } : {})
    });

    if (!luggage) {
      throw new NotFoundException(`Luggage with id ${id} not found`);
    }

    await this.luggageRepository.save(luggage);
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
