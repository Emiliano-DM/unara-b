import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripsService } from '../../src/trips/trips.service';
import { ItemsService } from '../../src/items/items.service';
import { LuggageService } from '../../src/luggage/services/luggage.service';
import { Trip } from '../../src/trips/entities/trip.entity';
import { TripParticipant } from '../../src/trips/entities/trip-participant.entity';
import { User } from '../../src/users/entities/user.entity';
import { Item } from '../../src/items/entities/item.entity';
import { Luggage } from '../../src/luggage/entities/luggage.entity';
import { ItemCategory } from '../../src/item-categories/entities/item-category.entity';
import { LuggageCategory } from '../../src/luggage-categories/entities/luggage-category.entity';
import { TripsModule } from '../../src/trips/trips.module';
import { ItemsModule } from '../../src/items/items.module';
import { LuggageModule } from '../../src/luggage/luggage.module';

describe('Trip Performance Tests', () => {
  let module: TestingModule;
  let tripsService: TripsService;
  let itemsService: ItemsService;
  let luggageService: LuggageService;
  let tripRepository: Repository<Trip>;
  let userRepository: Repository<User>;
  let participantRepository: Repository<TripParticipant>;
  let itemRepository: Repository<Item>;
  let luggageRepository: Repository<Luggage>;
  let itemCategoryRepository: Repository<ItemCategory>;
  let luggageCategoryRepository: Repository<LuggageCategory>;

  let testUser: User;
  let itemCategory: ItemCategory;
  let luggageCategory: LuggageCategory;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: Number(process.env.TEST_DB_PORT) || 5432,
          database: process.env.TEST_DB_NAME || 'unara_perf_test',
          username: process.env.TEST_DB_USERNAME || 'postgres',
          password: process.env.TEST_DB_PASSWORD || 'password',
          entities: [
            Trip,
            TripParticipant,
            User,
            Item,
            Luggage,
            ItemCategory,
            LuggageCategory,
          ],
          synchronize: true,
          dropSchema: true,
          logging: false,
        }),
        TripsModule,
        ItemsModule,
        LuggageModule,
      ],
    }).compile();

    tripsService = module.get<TripsService>(TripsService);
    itemsService = module.get<ItemsService>(ItemsService);
    luggageService = module.get<LuggageService>(LuggageService);
    tripRepository = module.get<Repository<Trip>>(getRepositoryToken(Trip));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    participantRepository = module.get<Repository<TripParticipant>>(
      getRepositoryToken(TripParticipant),
    );
    itemRepository = module.get<Repository<Item>>(getRepositoryToken(Item));
    luggageRepository = module.get<Repository<Luggage>>(
      getRepositoryToken(Luggage),
    );
    itemCategoryRepository = module.get<Repository<ItemCategory>>(
      getRepositoryToken(ItemCategory),
    );
    luggageCategoryRepository = module.get<Repository<LuggageCategory>>(
      getRepositoryToken(LuggageCategory),
    );
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Clean up data
    await participantRepository.delete({});
    await itemRepository.delete({});
    await luggageRepository.delete({});
    await tripRepository.delete({});
    await userRepository.delete({});
    await itemCategoryRepository.delete({});
    await luggageCategoryRepository.delete({});

    // Create test user and categories
    testUser = await userRepository.save({
      fullname: 'Performance Test User',
      email: 'perf@test.com',
      username: 'perfuser',
      password: 'hashedpassword',
    });

    itemCategory = await itemCategoryRepository.save({
      name: 'Test Category',
      description: 'For performance testing',
    });

    luggageCategory = await luggageCategoryRepository.save({
      name: 'Test Luggage Category',
      description: 'For performance testing',
    });
  });

  describe('Large Scale Trip Operations', () => {
    it('should handle 100 trips per user efficiently', async () => {
      const startTime = Date.now();
      const tripPromises: Promise<Trip>[] = [];

      // Create 100 trips concurrently
      for (let i = 0; i < 100; i++) {
        const createTripDto = {
          name: `Performance Trip ${i}`,
          description: `Description for trip ${i}`,
          destination: `Destination ${i}`,
        };
        tripPromises.push(tripsService.create(createTripDto, testUser.id));
      }

      const trips = await Promise.all(tripPromises);
      const creationTime = Date.now() - startTime;

      expect(trips).toHaveLength(100);
      expect(creationTime).toBeLessThan(10000); // Should complete in under 10 seconds

      console.log(`Created 100 trips in ${creationTime}ms`);

      // Test trip listing performance
      const listStartTime = Date.now();
      const userTrips = await tripsService.findAll(testUser.id, {
        limit: 50,
        offset: 0,
      });
      const listTime = Date.now() - listStartTime;

      expect(userTrips).toHaveLength(50); // Limited to 50
      expect(listTime).toBeLessThan(200); // Should list in under 200ms

      console.log(`Listed 50 trips in ${listTime}ms`);
    }, 30000); // 30 second timeout for this performance test

    it('should handle 50 participants per trip efficiently', async () => {
      // Create a trip
      const trip = await tripsService.create(
        {
          name: 'Large Participant Trip',
          description: 'Testing with many participants',
        },
        testUser.id,
      );

      // Create 50 users
      const userPromises: Promise<User>[] = [];
      for (let i = 0; i < 50; i++) {
        userPromises.push(
          userRepository.save({
            fullname: `Participant ${i}`,
            email: `participant${i}@test.com`,
            username: `participant${i}`,
            password: 'hashedpassword',
          }),
        );
      }

      const participants = await Promise.all(userPromises);

      // Invite all participants
      const startTime = Date.now();
      const invitePromises = participants.map((participant) =>
        tripsService.inviteParticipant(
          trip.id,
          { userId: participant.id },
          testUser.id,
        ),
      );

      await Promise.all(invitePromises);
      const inviteTime = Date.now() - startTime;

      expect(inviteTime).toBeLessThan(5000); // Should complete in under 5 seconds

      console.log(`Invited 50 participants in ${inviteTime}ms`);

      // Test finding trip with all participants
      const findStartTime = Date.now();
      const foundTrip = await tripsService.findOne(trip.id, testUser.id);
      const findTime = Date.now() - findStartTime;

      expect(foundTrip.participants).toHaveLength(50);
      expect(findTime).toBeLessThan(500); // Should find in under 500ms

      console.log(`Found trip with 50 participants in ${findTime}ms`);
    }, 30000);

    it('should handle large numbers of items and luggage efficiently', async () => {
      // Create a trip
      const trip = await tripsService.create(
        {
          name: 'Content Heavy Trip',
          description: 'Testing with lots of content',
        },
        testUser.id,
      );

      // Create 200 items
      const itemStartTime = Date.now();
      const itemPromises: Promise<Item>[] = [];

      for (let i = 0; i < 200; i++) {
        const createItemDto = {
          name: `Performance Item ${i}`,
          description: `Description for item ${i}`,
          categoryId: itemCategory.id,
        };
        itemPromises.push(
          itemsService.createForTrip(trip.id, createItemDto, testUser.id),
        );
      }

      await Promise.all(itemPromises);
      const itemCreationTime = Date.now() - itemStartTime;

      expect(itemCreationTime).toBeLessThan(15000); // Should complete in under 15 seconds

      console.log(`Created 200 items in ${itemCreationTime}ms`);

      // Create 100 luggage items
      const luggageStartTime = Date.now();
      const luggagePromises: Promise<Luggage>[] = [];

      for (let i = 0; i < 100; i++) {
        const createLuggageDto = {
          name: `Performance Luggage ${i}`,
          description: `Description for luggage ${i}`,
          categoryId: luggageCategory.id,
        };
        luggagePromises.push(
          luggageService.createForTrip(trip.id, createLuggageDto, testUser.id),
        );
      }

      await Promise.all(luggagePromises);
      const luggageCreationTime = Date.now() - luggageStartTime;

      expect(luggageCreationTime).toBeLessThan(10000); // Should complete in under 10 seconds

      console.log(`Created 100 luggage items in ${luggageCreationTime}ms`);

      // Test querying trip content
      const queryStartTime = Date.now();

      const [tripItems, tripLuggage] = await Promise.all([
        itemsService.findByTrip(trip.id, testUser.id, { limit: 50, offset: 0 }),
        luggageService.findByTrip(trip.id, testUser.id, {
          limit: 50,
          offset: 0,
        }),
      ]);

      const queryTime = Date.now() - queryStartTime;

      expect(tripItems).toHaveLength(50);
      expect(tripLuggage).toHaveLength(50);
      expect(queryTime).toBeLessThan(300); // Should query in under 300ms

      console.log(`Queried trip content in ${queryTime}ms`);
    }, 45000); // 45 second timeout
  });

  describe('Database Query Performance', () => {
    it('should query trip listings quickly with proper indexing', async () => {
      // Create trips for performance testing
      const trips: Trip[] = [];
      for (let i = 0; i < 50; i++) {
        const trip = await tripsService.create(
          {
            name: `Query Test Trip ${i}`,
            description: `Description ${i}`,
            status: i % 2 === 0 ? 'planning' : 'active',
            isPublic: i % 3 === 0,
          },
          testUser.id,
        );
        trips.push(trip);
      }

      // Test various query patterns
      const startTime = Date.now();

      // Query by status
      const planningTrips = await tripsService.findAll(testUser.id, {
        status: 'planning',
        limit: 20,
        offset: 0,
      });

      // Query public trips
      const publicTrips = await tripsService.findAll(testUser.id, {
        isPublic: true,
        limit: 20,
        offset: 0,
      });

      // Query by name pattern
      const namedTrips = await tripsService.findAll(testUser.id, {
        name: 'Query Test',
        limit: 20,
        offset: 0,
      });

      const queryTime = Date.now() - startTime;

      expect(planningTrips.length).toBeGreaterThan(0);
      expect(publicTrips.length).toBeGreaterThan(0);
      expect(namedTrips.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(500); // All queries should complete in under 500ms

      console.log(`Completed complex queries in ${queryTime}ms`);
    });

    it('should handle concurrent read operations efficiently', async () => {
      // Create test trip with content
      const trip = await tripsService.create(
        {
          name: 'Concurrent Read Test',
          description: 'Testing concurrent reads',
        },
        testUser.id,
      );

      // Add some content
      await Promise.all([
        itemsService.createForTrip(
          trip.id,
          {
            name: 'Test Item',
            categoryId: itemCategory.id,
          },
          testUser.id,
        ),
        luggageService.createForTrip(
          trip.id,
          {
            name: 'Test Luggage',
            categoryId: luggageCategory.id,
          },
          testUser.id,
        ),
      ]);

      // Simulate 20 concurrent read operations
      const startTime = Date.now();
      const readPromises = Array.from({ length: 20 }, () =>
        Promise.all([
          tripsService.findOne(trip.id, testUser.id),
          itemsService.findByTrip(trip.id, testUser.id),
          luggageService.findByTrip(trip.id, testUser.id),
        ]),
      );

      await Promise.all(readPromises);
      const concurrentReadTime = Date.now() - startTime;

      expect(concurrentReadTime).toBeLessThan(2000); // Should complete in under 2 seconds

      console.log(
        `20 concurrent read operations completed in ${concurrentReadTime}ms`,
      );
    });
  });

  describe('Memory Usage and Resource Management', () => {
    it('should handle pagination efficiently for large datasets', async () => {
      // Create trip with many items
      const trip = await tripsService.create(
        {
          name: 'Pagination Test Trip',
          description: 'Testing pagination performance',
        },
        testUser.id,
      );

      // Create 1000 items
      const batchSize = 100;
      for (let batch = 0; batch < 10; batch++) {
        const itemPromises: Promise<Item>[] = [];

        for (let i = 0; i < batchSize; i++) {
          const itemIndex = batch * batchSize + i;
          itemPromises.push(
            itemsService.createForTrip(
              trip.id,
              {
                name: `Pagination Item ${itemIndex}`,
                categoryId: itemCategory.id,
              },
              testUser.id,
            ),
          );
        }

        await Promise.all(itemPromises);
      }

      // Test paginated queries
      const pageSize = 50;
      const startTime = Date.now();

      // Get first 5 pages
      const pagePromises = Array.from({ length: 5 }, (_, pageIndex) =>
        itemsService.findByTrip(trip.id, testUser.id, {
          limit: pageSize,
          offset: pageIndex * pageSize,
        }),
      );

      const pages = await Promise.all(pagePromises);
      const paginationTime = Date.now() - startTime;

      // Verify pagination works correctly
      pages.forEach((page) => {
        expect(page).toHaveLength(pageSize);
      });

      expect(paginationTime).toBeLessThan(1000); // Should paginate efficiently

      console.log(`Paginated through 250 items in ${paginationTime}ms`);
    }, 60000); // 60 second timeout
  });
});
