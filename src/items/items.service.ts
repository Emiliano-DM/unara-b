import { Injectable, InternalServerErrorException, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { Repository } from 'typeorm';
import { FilterItemDto } from './dto/filter-item.dto';
import { ItemCategory } from 'src/item-categories/entities/item-category.entity';
import { TripsService } from '../trips/trips.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ItemsService {
  private readonly logger = new Logger('ItemsService');

  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,

    @InjectRepository(ItemCategory)
    private readonly itemCategoryRepository: Repository<ItemCategory>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly tripsService: TripsService,
  ) {}

  async create(createItemDto: CreateItemDto): Promise<Item> {
    const { categoryId, ...itemData } = createItemDto;

    const category = await this.itemCategoryRepository.findOneBy({ id: categoryId });

    if (!category) {
      throw new NotFoundException(`Category with id ${categoryId} not found`);
    }

    try {
      const item = this.itemRepository.create({
        ...itemData,
        category,
      });

      await this.itemRepository.save(item);
      return item;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(filterItemDto: FilterItemDto): Promise<Item[]> {
    const { 
      limit = 10, 
      offset = 0,
      name,
      categoryId,
    } = filterItemDto;

    const query = this.itemRepository
                      .createQueryBuilder('item')
                      .leftJoinAndSelect('item.category', 'category');

    if (name) {
      query.andWhere('item.name ILIKE :name', { name: `%${name}%` });
    }

    if (categoryId) {
      query.andWhere('category.id = :categoryId', { categoryId });
    }

    query.skip(offset).take(limit);

    return query.getMany();
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.itemRepository.findOne({ 
      where: { id },
      relations: { category: true },
    });

    if (!item) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }

    return item;
  }

  async update(id: string, updateItemDto: UpdateItemDto): Promise<Item> {
    const { categoryId, ...itemData } = updateItemDto;

    let category: ItemCategory | null = null;
    if (categoryId) {
      category = await this.itemCategoryRepository.findOneBy({ id: categoryId });

      if (!category) {
        throw new NotFoundException(`Category with id ${categoryId} not found`);
      }
    }

    const item = await this.itemRepository.preload({
      id,
      ...itemData,
      ...(category ? { category } : {}),
    });

    if (!item) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }

    try {
      await this.itemRepository.save(item);
      return item;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string): Promise<void> {
    const item = await this.itemRepository.findOneBy({ id });

    if (!item) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }

    await this.itemRepository.remove(item);
  }

  async createForTrip(tripId: string, createItemDto: CreateItemDto, userId: string): Promise<Item> {
    try {
      // Validate user has access to the trip
      const trip = await this.tripsService.findOne(tripId, userId);

      const { categoryId, ...itemData } = createItemDto;

      const category = await this.itemCategoryRepository.findOneBy({ id: categoryId });
      if (!category) {
        throw new NotFoundException(`Category with id ${categoryId} not found`);
      }

      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException(`User with id ${userId} not found`);
      }

      const item = this.itemRepository.create({
        ...itemData,
        category,
        trip,
        createdBy: user,
      });

      await this.itemRepository.save(item);
      return item;

    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findByTrip(tripId: string, userId: string, filterDto?: FilterItemDto): Promise<Item[]> {
    // Validate user has access to the trip
    await this.tripsService.findOne(tripId, userId);

    const { 
      limit = 10, 
      offset = 0,
      name,
      categoryId,
    } = filterDto || {};

    const query = this.itemRepository
                    .createQueryBuilder('item')
                    .leftJoinAndSelect('item.category', 'category')
                    .leftJoinAndSelect('item.trip', 'trip')
                    .leftJoinAndSelect('item.createdBy', 'createdBy')
                    .andWhere('trip.id = :tripId', { tripId });

    if (name) {
      query.andWhere('item.name ILIKE :name', { name: `%${name}%` });
    }
    
    if (categoryId) {
      query.andWhere('category.id = :categoryId', { categoryId });
    }

    query.skip(offset).take(limit);

    return query.getMany();
  }

  async updateForTrip(itemId: string, updateItemDto: UpdateItemDto, tripId: string, userId: string): Promise<Item> {
    // Validate user has access to the trip
    await this.tripsService.findOne(tripId, userId);

    // Find the item with its relations
    const item = await this.itemRepository.findOne({
      where: { id: itemId },
      relations: { trip: true, createdBy: true },
    });

    if (!item) {
      throw new NotFoundException(`Item with id ${itemId} not found`);
    }

    // Verify the item belongs to the specified trip
    if (item.trip?.id !== tripId) {
      throw new BadRequestException('Item does not belong to this trip');
    }

    const { categoryId, ...itemData } = updateItemDto;

    let category: ItemCategory | null = null;
    if (categoryId) {
      category = await this.itemCategoryRepository.findOneBy({ id: categoryId });
      if (!category) {
        throw new NotFoundException(`Category with id ${categoryId} not found`);
      }
    }

    const updatedItem = await this.itemRepository.preload({
      id: itemId,
      ...itemData,
      ...(category ? { category } : {}),
    });

    if (!updatedItem) {
      throw new NotFoundException(`Item with id ${itemId} not found`);
    }

    try {
      await this.itemRepository.save(updatedItem);
      return updatedItem;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async removeFromTrip(itemId: string, tripId: string, userId: string): Promise<void> {
    // Validate user has access to the trip
    await this.tripsService.findOne(tripId, userId);

    // Find the item with its relations
    const item = await this.itemRepository.findOne({
      where: { id: itemId },
      relations: { trip: true, createdBy: true },
    });

    if (!item) {
      throw new NotFoundException(`Item with id ${itemId} not found`);
    }

    // Verify the item belongs to the specified trip
    if (item.trip?.id !== tripId) {
      throw new BadRequestException('Item does not belong to this trip');
    }

    await this.itemRepository.remove(item);
  }

  private handleExceptions(error: any): never {
    // TODO: Add error codes as they are encountered
    // if (error.code === 0) throw new BadRequestException(error.detail)

    this.logger.error(error);

    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}
