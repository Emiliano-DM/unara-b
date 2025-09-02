import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Luggage } from '../entities/luggage.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from 'src/items/entities/item.entity';
import { UpsertLuggageItemDto } from '../dto/upsert-luggage-item.dto';
import { LuggageItem } from '../entities/luggage-item.entity';

@Injectable()
export class LuggageItemsService {
  private readonly logger = new Logger('LuggageItemsService');

  constructor(
    @InjectRepository(Luggage)
    private readonly luggageRepository: Repository<Luggage>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(LuggageItem)
    private readonly luggageItemRepository: Repository<LuggageItem>,
  ) {}

  async upsert(
    luggageId: string,
    itemId: string,
    dto: UpsertLuggageItemDto,
  ): Promise<LuggageItem> {
    const luggage = await this.luggageRepository.findOne({
      where: { id: luggageId },
    });
    if (!luggage) {
      throw new NotFoundException(`Luggage with id ${luggageId} not found`);
    }

    const item = await this.itemRepository.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException(`Item with id ${itemId} not found`);
    }

    try {
      const updateResult = await this.luggageItemRepository
        .createQueryBuilder()
        .update(LuggageItem)
        .set({ quantity: dto.quantity })
        .where('luggageId = :luggageId AND itemId = :itemId', {
          luggageId,
          itemId,
        })
        .execute();

      if (updateResult.affected === 0) {
        await this.luggageItemRepository
          .createQueryBuilder()
          .insert()
          .into(LuggageItem)
          .values({
            luggage: { id: luggageId },
            item: { id: itemId },
            quantity: dto.quantity,
          })
          .execute();
      }

      return await this.luggageItemRepository
        .createQueryBuilder('li')
        .leftJoinAndSelect('li.item', 'item')
        .where('li.luggageId = :luggageId AND li.itemId = :itemId', {
          luggageId,
          itemId,
        })
        .getOne();
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(luggageId: string): Promise<LuggageItem[]> {
    const luggageItems = await this.luggageItemRepository
      .createQueryBuilder('luggageItem')
      .leftJoinAndSelect('luggageItem.item', 'item')
      .where('luggageItem.luggageId = :luggageId', { luggageId })
      .getMany();

    return luggageItems;
  }

  async findOne(luggageId: string, itemId: string): Promise<LuggageItem> {
    const luggageItem = await this.luggageItemRepository
      .createQueryBuilder('luggageItem')
      .leftJoinAndSelect('luggageItem.item', 'item')
      .where('luggageItem.luggageId = :luggageId', { luggageId })
      .andWhere('luggageItem.itemId = :itemId', { itemId })
      .getOne();

    if (!luggageItem) {
      throw new NotFoundException(
        `Item with id ${itemId} not found in luggage ${luggageId}`,
      );
    }

    return luggageItem;
  }

  async remove(luggageId: string, itemId: string): Promise<void> {
    const result = await this.luggageItemRepository
      .createQueryBuilder()
      .delete()
      .from(LuggageItem)
      .where('luggageId = :luggageId AND itemId = :itemId', {
        luggageId,
        itemId,
      })
      .execute();

    if (result.affected === 0) {
      throw new NotFoundException(
        `Item with id ${itemId} not found in luggage ${luggageId}`,
      );
    }
  }

  private handleExceptions(error: any): never {
    // TODO: Add error codes as they are encountered
    // if (error.code === 0) throw new BadRequestException(error.detail)

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
