import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Trip } from 'src/trips/entities/trip.entity';
import { ItemCategory } from 'src/item-categories/entities/item-category.entity';
import { Place } from 'src/places/entities/place.entity';
import { Item } from 'src/items/entities/item.entity';
import { Luggage } from 'src/luggage/entities/luggage.entity';
import { LuggageItem } from 'src/luggage/entities/luggage-item.entity';
import { Activity } from 'src/activities/entities/activity.entity';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [TypeOrmModule.forFeature([User, Trip, ItemCategory, Place, Item, Luggage, LuggageItem, Activity])]
})
export class SeedModule {}
