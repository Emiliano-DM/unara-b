import { Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common"
import { Luggage } from "../entities/luggage.entity"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Item } from "src/items/entities/item.entity"
import { UpsertLuggageItemDto } from "../dto/upsert-luggage-item.dto"
import { LuggageItem } from "../entities/luggage-item.entity"
import { EventsGateway } from "src/events/events.gateway"

@Injectable()
export class LuggageItemsService {

  constructor(
    @InjectRepository(Luggage)
    private readonly luggageRepository: Repository<Luggage>,

    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,

    @InjectRepository(LuggageItem)
    private readonly luggageItemRepository: Repository<LuggageItem>,

    private readonly eventsGateway: EventsGateway,
  ){}

  async upsert(luggageId: string, itemId: string, dto: UpsertLuggageItemDto) {
    const luggage = await this.luggageRepository.findOne({
      where: { id: luggageId },
      relations: ['trip', 'user']
    })
    if (!luggage) {
      throw new NotFoundException(`Luggage with id ${luggageId} not found`)
    }

    const item = await this.itemRepository.findOne({ where: { id: itemId } })
    if (!item) {
      throw new NotFoundException(`Item with id ${itemId} not found`)
    }

    const updateData: Partial<LuggageItem> = { quantity: dto.quantity };
    if (dto.packed !== undefined) {
      updateData.packed = dto.packed;
    }

    const updateResult = await this.luggageItemRepository
                                    .createQueryBuilder()
                                    .update(LuggageItem)
                                    .set(updateData)
                                    .where('luggageId = :luggageId AND itemId = :itemId', { luggageId, itemId })
                                    .execute()

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

    const luggageItem = await this.luggageItemRepository
                      .createQueryBuilder('li')
                      .leftJoinAndSelect('li.item', 'item')
                      .where('li.luggageId = :luggageId AND li.itemId = :itemId', { luggageId, itemId })
                      .getOne();

    // Emit WebSocket event if luggage is linked to a trip
    if (luggage.trip) {
      // Emit packed status change event if packed was updated
      if (dto.packed !== undefined) {
        this.eventsGateway.emitLuggageItemPacked(luggage.trip.id, luggage.user.id, {
          luggageId: luggage.id,
          name: luggage.name,
          is_shared: luggage.is_shared || false,
          userId: luggage.user.id,
          itemId: item.id,
          itemName: item.name,
          packed: dto.packed,
        });
      } else {
        this.eventsGateway.emitLuggageItemAdded(luggage.trip.id, luggage.user.id, {
          luggageId: luggage.id,
          name: luggage.name,
          is_shared: luggage.is_shared || false,
          userId: luggage.user.id,
          itemId: item.id,
          itemName: item.name,
        });
      }
    }

    return luggageItem;
  }

  async findAll(luggageId: string) {
    const luggageItems = await this.luggageItemRepository
                                   .createQueryBuilder('luggageItem')
                                   .leftJoinAndSelect('luggageItem.item', 'item')
                                   .where('luggageItem.luggageId = :luggageId', { luggageId })
                                   .getMany();

    return luggageItems;
  }

  async findOne(luggageId: string, itemId: string) {
    const luggageItem = await this.luggageItemRepository
                                  .createQueryBuilder('luggageItem')
                                  .leftJoinAndSelect('luggageItem.item', 'item')
                                  .where('luggageItem.luggageId = :luggageId', { luggageId })
                                  .andWhere('luggageItem.itemId = :itemId', { itemId })
                                  .getOne();
    
    if (!luggageItem) {
      throw new NotFoundException(`Item with id ${itemId} not found in luggage ${luggageId}`);
    }

    return luggageItem;
  }

  async remove(luggageId: string,itemId: string) {
    const result = await this.luggageItemRepository
                             .createQueryBuilder()
                             .delete()
                             .from(LuggageItem)
                             .where('luggageId = :luggageId AND itemId = :itemId', { luggageId, itemId })
                             .execute()
    
    if (result.affected === 0) {
      throw new NotFoundException(`Item with id ${itemId} not found in luggage ${luggageId}`)
    }
  }
}
