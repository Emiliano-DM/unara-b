import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateLuggageCategoryDto } from './dto/create-luggage-category.dto';
import { UpdateLuggageCategoryDto } from './dto/update-luggage-category.dto';
import { LuggageCategory } from './entities/luggage-category.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterLuggageCategoryDto } from './dto/filter-luggage.dto';

@Injectable()
export class LuggageCategoriesService {
  private readonly logger = new Logger('LuggageCategoriesService');

  constructor(
    @InjectRepository(LuggageCategory)
    private readonly luggageCategoryRepository: Repository<LuggageCategory>,
  ) {}

  async create(createLuggageCategoryDto: CreateLuggageCategoryDto): Promise<LuggageCategory> {
    try {
      const luggageCategory = this.luggageCategoryRepository.create(createLuggageCategoryDto);
      await this.luggageCategoryRepository.save(luggageCategory);
      return luggageCategory;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(filterLuggageCategoryDto: FilterLuggageCategoryDto): Promise<LuggageCategory[]> {
    const { 
      limit = 10, 
      offset = 0,
      name,
      description,
    } = filterLuggageCategoryDto;

    const query = this.luggageCategoryRepository.createQueryBuilder('luggageCategory');

    if (name) {
      query.andWhere('luggageCategory.name ILIKE :name', { name: `%${name}%` });
    }

    if (description) {
      query.andWhere('luggageCategory.description ILIKE :description', { description: `%${description}%` });
    }

    query.skip(offset).take(limit);

    return query.getMany();
  }

  async findOne(id: string): Promise<LuggageCategory> {
    const luggageCategory = await this.luggageCategoryRepository.findOneBy({ id });

    if (!luggageCategory) {
      throw new NotFoundException(`Luggage category with id ${id} not found`);
    }

    return luggageCategory;
  }

  async update(id: string, updateLuggageCategoryDto: UpdateLuggageCategoryDto): Promise<LuggageCategory> {
    const luggageCategory = await this.luggageCategoryRepository.preload({
      id,
      ...updateLuggageCategoryDto,
    });

    if (!luggageCategory) {
      throw new NotFoundException(`Luggage category with id ${id} not found`);
    }

    try {
      await this.luggageCategoryRepository.save(luggageCategory);
      return luggageCategory;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string): Promise<void> {
    const luggageCategory = await this.luggageCategoryRepository.findOneBy({ id });

    if (!luggageCategory) {
      throw new NotFoundException(`Luggage category with id ${id} not found`);
    }

    await this.luggageCategoryRepository.remove(luggageCategory);
  }

  private handleExceptions(error: any): never {
    // TODO: Add error codes as they are encountered
    // if (error.code === 0) throw new BadRequestException(error.detail)

    this.logger.error(error);

    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}
