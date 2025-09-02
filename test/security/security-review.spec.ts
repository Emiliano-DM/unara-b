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
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('Security Review - Trip Management', () => {
  let module: TestingModule;
  let tripsService: TripsService;
  let itemsService: ItemsService;
  let luggageService: LuggageService;
  let tripRepository: Repository<Trip>;
  let userRepository: Repository<User>;
  let participantRepository: Repository<TripParticipant>;
  let itemCategoryRepository: Repository<ItemCategory>;
  let luggageCategoryRepository: Repository<LuggageCategory>;

  let ownerUser: User;
  let participantUser: User;
  let unauthorizedUser: User;
  let testTrip: Trip;
  let itemCategory: ItemCategory;
  let luggageCategory: LuggageCategory;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: Number(process.env.TEST_DB_PORT) || 5432,
          database: process.env.TEST_DB_NAME || 'unara_security_test',
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
    await tripRepository.delete({});
    await userRepository.delete({});
    await itemCategoryRepository.delete({});
    await luggageCategoryRepository.delete({});

    // Create test users
    ownerUser = await userRepository.save({
      fullname: 'Trip Owner',
      email: 'owner@security.test',
      username: 'tripowner',
      password: 'hashedpassword',
    });

    participantUser = await userRepository.save({
      fullname: 'Trip Participant',
      email: 'participant@security.test',
      username: 'participant',
      password: 'hashedpassword',
    });

    unauthorizedUser = await userRepository.save({
      fullname: 'Unauthorized User',
      email: 'unauthorized@security.test',
      username: 'unauthorized',
      password: 'hashedpassword',
    });

    // Create categories
    itemCategory = await itemCategoryRepository.save({
      name: 'Test Category',
      description: 'For security testing',
    });

    luggageCategory = await luggageCategoryRepository.save({
      name: 'Test Luggage Category',
      description: 'For security testing',
    });

    // Create test trip
    testTrip = await tripsService.create(
      {
        name: 'Security Test Trip',
        description: 'Testing security measures',
      },
      ownerUser.id,
    );

    // Add participant to trip
    await tripsService.inviteParticipant(
      testTrip.id,
      { userId: participantUser.id },
      ownerUser.id,
    );
    await tripsService.acceptInvitation(testTrip.id, participantUser.id);
  });

  describe('Authentication and Authorization', () => {
    it('should prevent unauthorized trip access', async () => {
      // Unauthorized user should not access trip
      await expect(
        tripsService.findOne(testTrip.id, unauthorizedUser.id),
      ).rejects.toThrow(ForbiddenException);

      // Should not be able to update trip
      await expect(
        tripsService.update(
          testTrip.id,
          { name: 'Hacked Trip' },
          unauthorizedUser.id,
        ),
      ).rejects.toThrow(ForbiddenException);

      // Should not be able to delete trip
      await expect(
        tripsService.remove(testTrip.id, unauthorizedUser.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should enforce role-based permissions', async () => {
      // Participant should access trip but not manage participants
      const trip = await tripsService.findOne(testTrip.id, participantUser.id);
      expect(trip.id).toBe(testTrip.id);

      // But should not be able to invite others
      await expect(
        tripsService.inviteParticipant(
          testTrip.id,
          { userId: unauthorizedUser.id },
          participantUser.id,
        ),
      ).rejects.toThrow(ForbiddenException);

      // Should not be able to change participant roles
      const participant = await participantRepository.findOne({
        where: { trip: { id: testTrip.id }, user: { id: participantUser.id } },
      });

      await expect(
        tripsService.updateParticipantRole(
          testTrip.id,
          participant.id,
          { role: 'admin' },
          participantUser.id,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should validate share token access correctly', async () => {
      // Private trip should not be accessible via share token
      await expect(
        tripsService.findByShareToken(testTrip.shareToken),
      ).rejects.toThrow(NotFoundException);

      // Make trip public
      await tripsService.update(testTrip.id, { isPublic: true }, ownerUser.id);

      // Now should be accessible
      const sharedTrip = await tripsService.findByShareToken(
        testTrip.shareToken,
      );
      expect(sharedTrip.id).toBe(testTrip.id);

      // Invalid token should fail
      await expect(
        tripsService.findByShareToken('invalid-token'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Input Validation and SQL Injection Prevention', () => {
    it('should prevent SQL injection in trip searches', async () => {
      const maliciousInputs = [
        "'; DROP TABLE trip; --",
        "' OR '1'='1",
        "'; INSERT INTO trip (name) VALUES ('hacked'); --",
        "<script>alert('xss')</script>",
        "'; UPDATE trip SET name='hacked' WHERE '1'='1'; --",
      ];

      for (const maliciousInput of maliciousInputs) {
        try {
          // These should not cause SQL injection or return unauthorized data
          const results = await tripsService.findAll(ownerUser.id, {
            name: maliciousInput,
            limit: 10,
            offset: 0,
          });

          // Should return empty or valid results, not error or unauthorized data
          expect(Array.isArray(results)).toBe(true);
        } catch (error) {
          // If it throws, should be a validation error, not SQL error
          expect(error.message).not.toContain('syntax error');
          expect(error.message).not.toContain('SQL');
        }
      }
    });

    it('should validate trip data input properly', async () => {
      const invalidInputs = [
        { name: '', description: 'Empty name should fail' },
        { name: 'x'.repeat(300), description: 'Name too long' },
        { name: 'Valid', status: 'invalid_status' },
        { name: 'Valid', isPublic: 'not_boolean' },
      ];

      for (const invalidInput of invalidInputs) {
        try {
          await tripsService.create(invalidInput as any, ownerUser.id);
          fail(
            `Should have failed validation for: ${JSON.stringify(invalidInput)}`,
          );
        } catch (error) {
          // Should be validation error, not SQL error
          expect(error).toBeInstanceOf(BadRequestException);
        }
      }
    });

    it('should prevent cross-trip data access', async () => {
      // Create another trip with different owner
      const otherTrip = await tripsService.create(
        {
          name: 'Other User Trip',
          description: 'Should not be accessible',
        },
        unauthorizedUser.id,
      );

      // Create items in both trips
      const ownerItem = await itemsService.createForTrip(
        testTrip.id,
        {
          name: 'Owner Item',
          categoryId: itemCategory.id,
        },
        ownerUser.id,
      );

      const otherItem = await itemsService.createForTrip(
        otherTrip.id,
        {
          name: 'Other Item',
          categoryId: itemCategory.id,
        },
        unauthorizedUser.id,
      );

      // User should not be able to access items from other trip
      await expect(
        itemsService.updateForTrip(
          otherItem.id,
          { name: 'Hacked' },
          testTrip.id,
          ownerUser.id,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        itemsService.removeFromTrip(otherItem.id, testTrip.id, ownerUser.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Share Token Security', () => {
    it('should generate cryptographically secure share tokens', () => {
      // Check that share tokens are unique and unpredictable
      const trips = Array.from({ length: 10 }, () => ({
        shareToken: '',
      }));

      trips.forEach((trip) => {
        const mockTrip = new Trip();
        mockTrip.generateShareToken();
        trip.shareToken = mockTrip.shareToken;
      });

      // All tokens should be unique
      const uniqueTokens = new Set(trips.map((t) => t.shareToken));
      expect(uniqueTokens.size).toBe(10);

      // Tokens should be hex strings of appropriate length
      trips.forEach((trip) => {
        expect(trip.shareToken).toMatch(/^[a-f0-9]{32}$/);
      });
    });

    it('should not expose share tokens in unauthorized contexts', async () => {
      // Unauthorized user should not see share token even if trip exists
      await expect(
        tripsService.findOne(testTrip.id, unauthorizedUser.id),
      ).rejects.toThrow(ForbiddenException);

      // Share token should only be visible to participants
      const ownerView = await tripsService.findOne(testTrip.id, ownerUser.id);
      expect(ownerView.shareToken).toBeDefined();

      const participantView = await tripsService.findOne(
        testTrip.id,
        participantUser.id,
      );
      expect(participantView.shareToken).toBeDefined();
    });

    it('should validate share token format', async () => {
      const invalidTokens = [
        'short',
        'invalid-characters!@#',
        'way-too-long-token-that-exceeds-normal-length-limits',
        '',
        null,
        undefined,
      ];

      for (const invalidToken of invalidTokens) {
        await expect(
          tripsService.findByShareToken(invalidToken as any),
        ).rejects.toThrow(NotFoundException);
      }
    });
  });

  describe('Data Integrity and Constraints', () => {
    it('should enforce unique constraints properly', async () => {
      // Share tokens should be unique
      const existingToken = testTrip.shareToken;

      // Try to create trip with same share token (manually)
      await expect(async () => {
        const newTrip = tripRepository.create({
          name: 'Duplicate Token Trip',
          shareToken: existingToken,
          owner: ownerUser,
        });
        await tripRepository.save(newTrip);
      }).rejects.toThrow();
    });

    it('should prevent duplicate participants', async () => {
      // User should not be able to join trip twice
      await expect(
        tripsService.inviteParticipant(
          testTrip.id,
          { userId: participantUser.id },
          ownerUser.id,
        ),
      ).rejects.toThrow(); // Should fail because user is already a participant

      // Database should enforce unique constraint
      const duplicateParticipant = participantRepository.create({
        trip: testTrip,
        user: participantUser,
        status: 'joined',
        invitedBy: ownerUser,
      });

      await expect(
        participantRepository.save(duplicateParticipant),
      ).rejects.toThrow();
    });

    it('should handle cascade deletes securely', async () => {
      // Create items and luggage for trip
      const item = await itemsService.createForTrip(
        testTrip.id,
        {
          name: 'Test Item',
          categoryId: itemCategory.id,
        },
        ownerUser.id,
      );

      const luggage = await luggageService.createForTrip(
        testTrip.id,
        {
          name: 'Test Luggage',
          categoryId: luggageCategory.id,
        },
        ownerUser.id,
      );

      // Delete trip should cascade to participants, items, and luggage
      await tripsService.remove(testTrip.id, ownerUser.id);

      // Verify cascade deletes worked
      const remainingParticipants = await participantRepository.count({
        where: { trip: { id: testTrip.id } },
      });
      expect(remainingParticipants).toBe(0);

      // Items and luggage should also be deleted
      await expect(
        itemsService.findByTrip(testTrip.id, ownerUser.id),
      ).rejects.toThrow();
    });
  });

  describe('Permission Escalation Prevention', () => {
    it('should prevent privilege escalation through trip roles', async () => {
      // Participant should not be able to promote themselves
      const participant = await participantRepository.findOne({
        where: { trip: { id: testTrip.id }, user: { id: participantUser.id } },
      });

      await expect(
        tripsService.updateParticipantRole(
          testTrip.id,
          participant.id,
          { role: 'owner' },
          participantUser.id,
        ),
      ).rejects.toThrow(ForbiddenException);

      // Should not be able to promote other participants
      await expect(
        tripsService.updateParticipantRole(
          testTrip.id,
          participant.id,
          { role: 'admin' },
          participantUser.id,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent unauthorized trip modifications', async () => {
      // Participant should not be able to change trip ownership
      await expect(
        tripsService.update(
          testTrip.id,
          { owner: participantUser } as any,
          participantUser.id,
        ),
      ).rejects.toThrow(ForbiddenException);

      // Should not be able to delete trip
      await expect(
        tripsService.remove(testTrip.id, participantUser.id),
      ).rejects.toThrow(ForbiddenException);

      // Should not be able to change sensitive settings
      await expect(
        tripsService.update(
          testTrip.id,
          { shareToken: 'hacked-token' } as any,
          participantUser.id,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Information Disclosure Prevention', () => {
    it('should not leak sensitive information in error messages', async () => {
      try {
        await tripsService.findOne('non-existent-id', unauthorizedUser.id);
        fail('Should have thrown an error');
      } catch (error) {
        // Error message should not reveal whether trip exists or not
        expect(error.message).not.toContain('exists');
        expect(error.message).not.toContain('found');
        expect(error).toBeInstanceOf(ForbiddenException);
      }
    });

    it('should filter sensitive data in API responses', async () => {
      const trip = await tripsService.findOne(testTrip.id, ownerUser.id);

      // Should not expose internal IDs or sensitive user data
      expect(trip.owner.password).toBeUndefined();

      // Participants should not expose sensitive user data
      if (trip.participants?.length > 0) {
        trip.participants.forEach((participant) => {
          expect(participant.user.password).toBeUndefined();
        });
      }
    });
  });
});
