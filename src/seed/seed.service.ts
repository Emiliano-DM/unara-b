import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { MOCK_USERS } from './data/user.data';
import { MOCK_TRIPS } from './data/trip.data';
import { MOCK_ITEM_CATEGORIES } from './data/item-category.data';
import { Trip } from 'src/trips/entities/trip.entity';
import { ItemCategory } from 'src/item-categories/entities/item-category.entity';
import { createMockPlaces } from './data/place.data';
import { createMockItems } from './data/item.data';
import { createMockLuggage } from './data/luggage.data';
import { Place } from 'src/places/entities/place.entity';
import { Item } from 'src/items/entities/item.entity';
import { Luggage } from 'src/luggage/entities/luggage.entity';
import { LuggageItem } from 'src/luggage/entities/luggage-item.entity';
import { Activity } from 'src/activities/entities/activity.entity';
import { createMockLuggageItems } from './data/luggage-item.data';
import { createMockActivities } from './data/activity.data';

@Injectable()
export class SeedService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Trip)
        private readonly tripRepository: Repository<Trip>,
        @InjectRepository(ItemCategory)
        private readonly itemCategoryRepository: Repository<ItemCategory>,
        @InjectRepository(Place)
        private readonly placeRepository: Repository<Place>,
        @InjectRepository(Item)
        private readonly itemRepository: Repository<Item>,
        @InjectRepository(Luggage)
        private readonly luggageRepository: Repository<Luggage>,
        @InjectRepository(LuggageItem)
        private readonly luggageItemRepository: Repository<LuggageItem>,
        @InjectRepository(Activity)
        private readonly activityRepository: Repository<Activity>,
        private readonly dataSource: DataSource
    ){}

    async runSeed(){
        return await this.dataSource.transaction(async (manager) => {
            try {
                console.log('Starting database seed...');

                const users_data = MOCK_USERS;
                const trip_data = MOCK_TRIPS;
                const item_categories_data = MOCK_ITEM_CATEGORIES;

                //Clearing database (delete in reverse dependency order)
                console.log('Clearing existing data...');
                await manager.getRepository(LuggageItem).createQueryBuilder().delete().execute();
                await manager.getRepository(Activity).createQueryBuilder().delete().execute();
                await manager.getRepository(Luggage).createQueryBuilder().delete().execute();
                await manager.getRepository(Item).createQueryBuilder().delete().execute();
                await manager.getRepository(Place).createQueryBuilder().delete().execute();
                await manager.getRepository(Trip).createQueryBuilder().delete().execute();
                await manager.getRepository(ItemCategory).createQueryBuilder().delete().execute();
                await manager.getRepository(User).createQueryBuilder().delete().execute();
                console.log('Database cleared');

                //Independent entities
                //TODO: change trip to be dependent by user
                console.log('Seeding users...');
                await manager.getRepository(User).insert(users_data);
                console.log(`${users_data.length} users created`);

                console.log('Seeding trips...');
                const savedTrips = await manager.getRepository(Trip).save(trip_data);
                console.log(`${savedTrips.length} trips created`);

                console.log('Seeding item categories...');
                const savedCategories = await manager.getRepository(ItemCategory).save(item_categories_data);
                console.log(`${savedCategories.length} item categories created`);

                //Dependent entities
                console.log('Seeding places...');
                const places = createMockPlaces(savedTrips);
                const savedPlaces = await manager.getRepository(Place).save(places);
                console.log(`${savedPlaces.length} places created`);

                console.log('Seeding items...');
                const items = createMockItems(savedCategories);
                const savedItems = await manager.getRepository(Item).save(items);
                console.log(`${savedItems.length} items created`);

                console.log('Seeding luggage...');
                const luggage = createMockLuggage(savedTrips);
                const savedLuggages = await manager.getRepository(Luggage).save(luggage);
                console.log(`${savedLuggages.length} luggage lists created`);

                console.log('Seeding activities...');
                const activities = createMockActivities(savedTrips, savedPlaces);
                const savedActivities = await manager.getRepository(Activity).save(activities);
                console.log(`${savedActivities.length} activities created`);

                console.log('Seeding luggage items...');
                const luggageItems = createMockLuggageItems(savedLuggages, savedItems);
                const savedLuggageItems = await manager.getRepository(LuggageItem).save(luggageItems);
                console.log(`${savedLuggageItems.length} luggage items created`);

                const summary = {
                    message: 'Seed executed successfully',
                    counts: {
                        users: users_data.length,
                        trips: savedTrips.length,
                        itemCategories: savedCategories.length,
                        places: savedPlaces.length,
                        items: savedItems.length,
                        luggage: savedLuggages.length,
                        activities: savedActivities.length,
                        luggageItems: savedLuggageItems.length,
                    },
                    total: users_data.length + savedTrips.length + savedCategories.length +
                           savedPlaces.length + savedItems.length + savedLuggages.length +
                           savedActivities.length + savedLuggageItems.length
                };

                console.log(`\nSeed completed! Total records created: ${summary.total}`);
                return summary;
            } catch (error) {
                console.error('Seed failed:', error.message);
                console.log('Transaction rolled back');
                throw new Error(`Seed failed: ${error.message}`);
            }
        });
    }
}
