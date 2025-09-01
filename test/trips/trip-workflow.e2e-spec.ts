import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripsModule } from '../../src/trips/trips.module';
import { ItemsModule } from '../../src/items/items.module';
import { LuggageModule } from '../../src/luggage/luggage.module';
import { UsersModule } from '../../src/users/users.module';
import { Trip } from '../../src/trips/entities/trip.entity';
import { TripParticipant } from '../../src/trips/entities/trip-participant.entity';
import { User } from '../../src/users/entities/user.entity';
import { Item } from '../../src/items/entities/item.entity';
import { Luggage } from '../../src/luggage/entities/luggage.entity';
import { ItemCategory } from '../../src/item-categories/entities/item-category.entity';
import { LuggageCategory } from '../../src/luggage-categories/entities/luggage-category.entity';

describe('Complete Trip Workflow (e2e)', () => {
  let app: INestApplication;
  let tripRepository: Repository<Trip>;
  let userRepository: Repository<User>;
  let participantRepository: Repository<TripParticipant>;
  let itemRepository: Repository<Item>;
  let luggageRepository: Repository<Luggage>;
  let itemCategoryRepository: Repository<ItemCategory>;
  let luggageCategoryRepository: Repository<LuggageCategory>;

  let testOwner: User;
  let testParticipant: User;
  let testTrip: Trip;
  let itemCategory: ItemCategory;
  let luggageCategory: LuggageCategory;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: Number(process.env.TEST_DB_PORT) || 5432,
          database: process.env.TEST_DB_NAME || 'unara_test_e2e',
          username: process.env.TEST_DB_USERNAME || 'postgres',
          password: process.env.TEST_DB_PASSWORD || 'password',
          entities: [Trip, TripParticipant, User, Item, Luggage, ItemCategory, LuggageCategory],
          synchronize: true,
          dropSchema: true,
          logging: false,
        }),
        TripsModule,
        ItemsModule,
        LuggageModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get repositories
    tripRepository = moduleFixture.get<Repository<Trip>>(getRepositoryToken(Trip));
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    participantRepository = moduleFixture.get<Repository<TripParticipant>>(getRepositoryToken(TripParticipant));
    itemRepository = moduleFixture.get<Repository<Item>>(getRepositoryToken(Item));
    luggageRepository = moduleFixture.get<Repository<Luggage>>(getRepositoryToken(Luggage));
    itemCategoryRepository = moduleFixture.get<Repository<ItemCategory>>(getRepositoryToken(ItemCategory));
    luggageCategoryRepository = moduleFixture.get<Repository<LuggageCategory>>(getRepositoryToken(LuggageCategory));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clear all data
    await participantRepository.delete({});
    await itemRepository.delete({});
    await luggageRepository.delete({});
    await tripRepository.delete({});
    await userRepository.delete({});
    await itemCategoryRepository.delete({});
    await luggageCategoryRepository.delete({});

    // Create test users
    testOwner = await userRepository.save({
      fullname: 'Trip Owner',
      email: 'owner@test.com',
      username: 'tripowner',
      password: 'hashedpassword',
    });

    testParticipant = await userRepository.save({
      fullname: 'Trip Participant',
      email: 'participant@test.com',
      username: 'participant',
      password: 'hashedpassword',
    });

    // Create categories
    itemCategory = await itemCategoryRepository.save({
      name: 'Electronics',
      description: 'Electronic items',
    });

    luggageCategory = await luggageCategoryRepository.save({
      name: 'Clothing',
      description: 'Clothing items',
    });
  });

  describe('Complete Trip Lifecycle', () => {
    it('should handle full trip workflow: create → invite → manage content → cleanup', async () => {
      // Step 1: Create a trip
      const createTripDto = {
        name: 'European Adventure',
        description: 'A month-long trip across Europe',
        destination: 'Europe',
      };

      const tripResponse = await request(app.getHttpServer())
        .post('/trips')
        .send(createTripDto)
        .set('user-id', testOwner.id) // Mock authentication
        .expect(201);

      testTrip = tripResponse.body;
      expect(testTrip.name).toBe(createTripDto.name);
      expect(testTrip.owner.id).toBe(testOwner.id);
      expect(testTrip.shareToken).toBeDefined();

      // Step 2: Invite a participant
      const inviteDto = { userId: testParticipant.id };

      await request(app.getHttpServer())
        .post(`/trips/${testTrip.id}/invite`)
        .send(inviteDto)
        .set('user-id', testOwner.id)
        .expect(201);

      // Verify participant was invited
      const participants = await participantRepository.find({
        where: { trip: { id: testTrip.id } },
        relations: ['user'],
      });

      expect(participants).toHaveLength(1);
      expect(participants[0].user.id).toBe(testParticipant.id);
      expect(participants[0].status).toBe('pending');

      // Step 3: Accept invitation
      await request(app.getHttpServer())
        .post(`/trips/${testTrip.id}/join`)
        .set('user-id', testParticipant.id)
        .expect(200);

      // Verify participant joined
      const updatedParticipant = await participantRepository.findOne({
        where: { trip: { id: testTrip.id }, user: { id: testParticipant.id } },
      });
      expect(updatedParticipant?.status).toBe('joined');

      // Step 4: Owner creates luggage
      const createLuggageDto = {
        name: 'Travel Backpack',
        categoryId: luggageCategory.id,
      };

      const luggageResponse = await request(app.getHttpServer())
        .post(`/trips/${testTrip.id}/luggage`)
        .send(createLuggageDto)
        .set('user-id', testOwner.id)
        .expect(201);

      expect(luggageResponse.body.name).toBe(createLuggageDto.name);
      expect(luggageResponse.body.trip.id).toBe(testTrip.id);

      // Step 5: Participant creates items
      const createItemDto = {
        name: 'Travel Camera',
        description: 'High-quality camera for the trip',
        categoryId: itemCategory.id,
      };

      const itemResponse = await request(app.getHttpServer())
        .post(`/trips/${testTrip.id}/items`)
        .send(createItemDto)
        .set('user-id', testParticipant.id)
        .expect(201);

      expect(itemResponse.body.name).toBe(createItemDto.name);
      expect(itemResponse.body.trip.id).toBe(testTrip.id);
      expect(itemResponse.body.createdBy.id).toBe(testParticipant.id);

      // Step 6: List trip content
      // List trip luggage
      const luggageListResponse = await request(app.getHttpServer())
        .get(`/trips/${testTrip.id}/luggage`)
        .set('user-id', testOwner.id)
        .expect(200);

      expect(luggageListResponse.body).toHaveLength(1);
      expect(luggageListResponse.body[0].name).toBe(createLuggageDto.name);

      // List trip items
      const itemsListResponse = await request(app.getHttpServer())
        .get(`/trips/${testTrip.id}/items`)
        .set('user-id', testParticipant.id)
        .expect(200);

      expect(itemsListResponse.body).toHaveLength(1);
      expect(itemsListResponse.body[0].name).toBe(createItemDto.name);

      // Step 7: Update trip status
      const updateTripDto = { status: 'active' };

      await request(app.getHttpServer())
        .patch(`/trips/${testTrip.id}`)
        .send(updateTripDto)
        .set('user-id', testOwner.id)
        .expect(200);

      // Step 8: Cleanup - Delete trip (cascade delete should handle everything)
      await request(app.getHttpServer())
        .delete(`/trips/${testTrip.id}`)
        .set('user-id', testOwner.id)
        .expect(200);

      // Verify cascade deletes worked
      const remainingParticipants = await participantRepository.find({
        where: { trip: { id: testTrip.id } },
      });
      const remainingLuggage = await luggageRepository.find({
        where: { trip: { id: testTrip.id } },
      });
      const remainingItems = await itemRepository.find({
        where: { trip: { id: testTrip.id } },
      });

      expect(remainingParticipants).toHaveLength(0);
      expect(remainingLuggage).toHaveLength(0);
      expect(remainingItems).toHaveLength(0);
    });
  });

  describe('Permission Enforcement Throughout Workflow', () => {
    it('should enforce permissions correctly at each step', async () => {
      // Create trip as owner
      const createTripDto = {
        name: 'Private Trip',
        description: 'Only owner can manage',
      };

      const tripResponse = await request(app.getHttpServer())
        .post('/trips')
        .send(createTripDto)
        .set('user-id', testOwner.id)
        .expect(201);

      const privateTrip = tripResponse.body;

      // Non-owner should not be able to invite participants
      await request(app.getHttpServer())
        .post(`/trips/${privateTrip.id}/invite`)
        .send({ userId: testParticipant.id })
        .set('user-id', testParticipant.id)
        .expect(403);

      // Non-participant should not be able to access trip content
      await request(app.getHttpServer())
        .get(`/trips/${privateTrip.id}/items`)
        .set('user-id', testParticipant.id)
        .expect(403);

      // Non-owner should not be able to delete trip
      await request(app.getHttpServer())
        .delete(`/trips/${privateTrip.id}`)
        .set('user-id', testParticipant.id)
        .expect(403);
    });
  });

  describe('Share Token Functionality', () => {
    it('should allow joining via share token when public', async () => {
      // Create public trip
      const createTripDto = {
        name: 'Public Adventure',
        description: 'Anyone can join',
        isPublic: true,
      };

      const tripResponse = await request(app.getHttpServer())
        .post('/trips')
        .send(createTripDto)
        .set('user-id', testOwner.id)
        .expect(201);

      const publicTrip = tripResponse.body;

      // Non-participant should be able to find trip by share token
      const sharedTripResponse = await request(app.getHttpServer())
        .get(`/trips/shared/${publicTrip.shareToken}`)
        .expect(200);

      expect(sharedTripResponse.body.id).toBe(publicTrip.id);
      expect(sharedTripResponse.body.name).toBe(createTripDto.name);

      // Should be able to join via share token
      await request(app.getHttpServer())
        .post(`/trips/${publicTrip.id}/join`)
        .set('user-id', testParticipant.id)
        .expect(200);

      // Verify participant was added
      const participant = await participantRepository.findOne({
        where: { trip: { id: publicTrip.id }, user: { id: testParticipant.id } },
      });
      expect(participant?.status).toBe('joined');
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency under concurrent operations', async () => {
      // Create trip
      const createTripDto = {
        name: 'Concurrent Test Trip',
        description: 'Testing concurrent operations',
      };

      const tripResponse = await request(app.getHttpServer())
        .post('/trips')
        .send(createTripDto)
        .set('user-id', testOwner.id)
        .expect(201);

      const concurrentTrip = tripResponse.body;

      // Simulate concurrent item creation
      const itemPromises = Array.from({ length: 5 }, (_, i) =>
        request(app.getHttpServer())
          .post(`/trips/${concurrentTrip.id}/items`)
          .send({
            name: `Concurrent Item ${i}`,
            categoryId: itemCategory.id,
          })
          .set('user-id', testOwner.id)
      );

      const itemResults = await Promise.allSettled(itemPromises);
      const successfulItems = itemResults.filter(result => result.status === 'fulfilled');

      // All items should be created successfully
      expect(successfulItems).toHaveLength(5);

      // Verify all items are in database
      const createdItems = await itemRepository.find({
        where: { trip: { id: concurrentTrip.id } },
      });
      expect(createdItems).toHaveLength(5);
    });
  });
});