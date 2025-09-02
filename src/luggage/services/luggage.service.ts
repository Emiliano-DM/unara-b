import { Injectable, InternalServerErrorException, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LuggageCategory } from 'src/luggage-categories/entities/luggage-category.entity';
import { Luggage } from '../entities/luggage.entity';
import { CreateLuggageDto } from '../dto/create-luggage.dto';
import { FilterLuggageDto } from '../dto/filter-luggage.dto';
import { UpdateLuggageDto } from '../dto/update-luggage.dto';
import { TripsService } from '../../trips/trips.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class LuggageService {

  private readonly logger = new Logger('LuggageService');
  
  constructor(
    @InjectRepository(Luggage)
    private readonly luggageRepository: Repository<Luggage>,

    @InjectRepository(LuggageCategory)
    private readonly luggageCategoryRepository: Repository<LuggageCategory>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly tripsService: TripsService,
  ) {}

  async create(createLuggageDto: CreateLuggageDto): Promise<Luggage> {
    try {
      const { categoryId, ...luggageData } = createLuggageDto;

      const category = await this.luggageCategoryRepository.findOneBy({ id: categoryId });

      if (!category) {
        throw new NotFoundException(`Category with id ${categoryId} not found`);
      }

      const luggage = this.luggageRepository.create({
        ...luggageData,
        category,
      });
      
      await this.luggageRepository.save(luggage);
      return luggage;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(filterLuggageDto: FilterLuggageDto): Promise<Luggage[]> {
    const { 
      limit = 10, 
      offset = 0,
      name,
      categoryId,
    } = filterLuggageDto;

    const query = this.luggageRepository
                    .createQueryBuilder('luggage')
                    .leftJoinAndSelect('luggage.category', 'category');

    if (name) {
      query.andWhere('luggage.name ILIKE :name', { name: `%${name}%` });
    }
    
    if (categoryId) {
      query.andWhere('category.id = :categoryId', { categoryId });
    }

    query.skip(offset).take(limit);

    return query.getMany();
  }

  async findOne(id: string): Promise<Luggage> {
    const luggage = await this.luggageRepository.findOne({
      where: { id },
      relations: { category: true },
    });

    if (!luggage) {
      throw new NotFoundException(`Luggage with id ${id} not found`);
    }

    return luggage;
  }

  async update(id: string, updateLuggageDto: UpdateLuggageDto): Promise<Luggage> {
    const { categoryId, ...luggageData } = updateLuggageDto;

    let category: LuggageCategory | null = null;
    if (categoryId) {
      category = await this.luggageCategoryRepository.findOneBy({ id: categoryId });

      if (!category) {
        throw new NotFoundException(`Category with id ${categoryId} not found`);
      }
    }

    const luggage = await this.luggageRepository.preload({
      id,
      ...luggageData,
      ...(category ? { category } : {}),
    });

    if (!luggage) {
      throw new NotFoundException(`Luggage with id ${id} not found`);
    }

    try {
      await this.luggageRepository.save(luggage);
      return luggage;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string): Promise<void> {
    const luggage = await this.luggageRepository.findOneBy({ id });

    if (!luggage) {
      throw new NotFoundException(`Luggage with id ${id} not found`);
    }

    await this.luggageRepository.remove(luggage);
  }

  async createForTrip(tripId: string, createLuggageDto: CreateLuggageDto, userId: string): Promise<Luggage> {
    try {
      // Validate user has access to the trip
      const trip = await this.tripsService.findOne(tripId, userId);

      const { categoryId, ...luggageData } = createLuggageDto;

      const category = await this.luggageCategoryRepository.findOneBy({ id: categoryId });
      if (!category) {
        throw new NotFoundException(`Category with id ${categoryId} not found`);
      }

      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException(`User with id ${userId} not found`);
      }

      const luggage = this.luggageRepository.create({
        ...luggageData,
        category,
        trip,
        user,
      });
      
      await this.luggageRepository.save(luggage);
      return luggage;

    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findByTrip(tripId: string, userId: string, filterDto?: FilterLuggageDto): Promise<Luggage[]> {
    // Validate user has access to the trip
    await this.tripsService.findOne(tripId, userId);

    const { 
      limit = 10, 
      offset = 0,
      name,
      categoryId,
    } = filterDto || {};

    const query = this.luggageRepository
                    .createQueryBuilder('luggage')
                    .leftJoinAndSelect('luggage.category', 'category')
                    .leftJoinAndSelect('luggage.trip', 'trip')
                    .leftJoinAndSelect('luggage.user', 'user')
                    .andWhere('trip.id = :tripId', { tripId });

    if (name) {
      query.andWhere('luggage.name ILIKE :name', { name: `%${name}%` });
    }
    
    if (categoryId) {
      query.andWhere('category.id = :categoryId', { categoryId });
    }

    query.skip(offset).take(limit);

    return query.getMany();
  }

  async updateForTrip(luggageId: string, updateLuggageDto: UpdateLuggageDto, tripId: string, userId: string): Promise<Luggage> {
    // Validate user has access to the trip
    await this.tripsService.findOne(tripId, userId);

    // Find the luggage with its relations
    const luggage = await this.luggageRepository.findOne({
      where: { id: luggageId },
      relations: { trip: true, user: true },
    });

    if (!luggage) {
      throw new NotFoundException(`Luggage with id ${luggageId} not found`);
    }

    // Verify the luggage belongs to the specified trip
    if (luggage.trip?.id !== tripId) {
      throw new BadRequestException('Luggage does not belong to this trip');
    }

    const { categoryId, ...luggageData } = updateLuggageDto;

    let category: LuggageCategory | null = null;
    if (categoryId) {
      category = await this.luggageCategoryRepository.findOneBy({ id: categoryId });
      if (!category) {
        throw new NotFoundException(`Category with id ${categoryId} not found`);
      }
    }

    const updatedLuggage = await this.luggageRepository.preload({
      id: luggageId,
      ...luggageData,
      ...(category ? { category } : {}),
    });

    if (!updatedLuggage) {
      throw new NotFoundException(`Luggage with id ${luggageId} not found`);
    }

    try {
      await this.luggageRepository.save(updatedLuggage);
      return updatedLuggage;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async removeFromTrip(luggageId: string, tripId: string, userId: string): Promise<void> {
    // Validate user has access to the trip
    await this.tripsService.findOne(tripId, userId);

    // Find the luggage with its relations
    const luggage = await this.luggageRepository.findOne({
      where: { id: luggageId },
      relations: { trip: true, user: true },
    });

    if (!luggage) {
      throw new NotFoundException(`Luggage with id ${luggageId} not found`);
    }

    // Verify the luggage belongs to the specified trip
    if (luggage.trip?.id !== tripId) {
      throw new BadRequestException('Luggage does not belong to this trip');
    }

    await this.luggageRepository.remove(luggage);
  }

  private handleExceptions(error: any): never {
    // TODO: Add error codes as they are encountered
    // if (error.code === 0) throw new BadRequestException(error.detail)

    this.logger.error(error);

    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}
