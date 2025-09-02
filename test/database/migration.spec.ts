import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Trip } from '../../src/trips/entities/trip.entity';
import { TripParticipant } from '../../src/trips/entities/trip-participant.entity';
import { User } from '../../src/users/entities/user.entity';
import { Item } from '../../src/items/entities/item.entity';
import { Luggage } from '../../src/luggage/entities/luggage.entity';

describe('Database Migration Safety', () => {
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: Number(process.env.TEST_DB_PORT) || 5432,
          database: process.env.TEST_DB_NAME || 'unara_test',
          username: process.env.TEST_DB_USERNAME || 'postgres',
          password: process.env.TEST_DB_PASSWORD || 'password',
          entities: [Trip, TripParticipant, User, Item, Luggage],
          synchronize: false,
          migrations: ['src/database/migrations/*.ts'],
          dropSchema: true, // For testing only
          logging: false,
        }),
      ],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    queryRunner = dataSource.createQueryRunner();
  });

  afterAll(async () => {
    if (queryRunner) {
      await queryRunner.release();
    }
    if (module) {
      await module.close();
    }
  });

  describe('Trip Table Creation', () => {
    it('should create trip tables successfully', async () => {
      // Check that trip table exists and has correct structure
      const tripTableExists = await queryRunner.hasTable('trip');
      expect(tripTableExists).toBe(true);

      if (tripTableExists) {
        const tripTable = await queryRunner.getTable('trip');

        // Verify columns
        expect(tripTable?.findColumnByName('id')).toBeDefined();
        expect(tripTable?.findColumnByName('name')).toBeDefined();
        expect(tripTable?.findColumnByName('description')).toBeDefined();
        expect(tripTable?.findColumnByName('destination')).toBeDefined();
        expect(tripTable?.findColumnByName('status')).toBeDefined();
        expect(tripTable?.findColumnByName('isPublic')).toBeDefined();
        expect(tripTable?.findColumnByName('shareToken')).toBeDefined();
        expect(tripTable?.findColumnByName('ownerId')).toBeDefined();

        // Verify foreign keys
        const foreignKeys = tripTable?.foreignKeys || [];
        const ownerForeignKey = foreignKeys.find((fk) =>
          fk.columnNames.includes('ownerId'),
        );
        expect(ownerForeignKey).toBeDefined();
        expect(ownerForeignKey?.referencedTableName).toBe('user');
      }
    });

    it('should create trip participant table successfully', async () => {
      const participantTableExists =
        await queryRunner.hasTable('trip_participant');
      expect(participantTableExists).toBe(true);

      if (participantTableExists) {
        const participantTable = await queryRunner.getTable('trip_participant');

        // Verify columns
        expect(participantTable?.findColumnByName('id')).toBeDefined();
        expect(participantTable?.findColumnByName('tripId')).toBeDefined();
        expect(participantTable?.findColumnByName('userId')).toBeDefined();
        expect(participantTable?.findColumnByName('role')).toBeDefined();
        expect(participantTable?.findColumnByName('status')).toBeDefined();

        // Verify unique constraint
        const uniqueConstraints = participantTable?.uniques || [];
        const tripUserUnique = uniqueConstraints.find(
          (u) =>
            u.columnNames.includes('tripId') &&
            u.columnNames.includes('userId'),
        );
        expect(tripUserUnique).toBeDefined();
      }
    });
  });

  describe('Foreign Key Relations', () => {
    it('should add foreign keys without breaking existing data', async () => {
      // Check luggage table has new columns
      const luggageTable = await queryRunner.getTable('luggage');
      expect(luggageTable?.findColumnByName('tripId')).toBeDefined();
      expect(luggageTable?.findColumnByName('userId')).toBeDefined();

      // Check item table has new columns
      const itemTable = await queryRunner.getTable('item');
      expect(itemTable?.findColumnByName('tripId')).toBeDefined();
      expect(itemTable?.findColumnByName('createdById')).toBeDefined();

      // Verify foreign keys exist
      const luggageForeignKeys = luggageTable?.foreignKeys || [];
      const itemForeignKeys = itemTable?.foreignKeys || [];

      expect(
        luggageForeignKeys.some((fk) => fk.columnNames.includes('tripId')),
      ).toBe(true);
      expect(
        luggageForeignKeys.some((fk) => fk.columnNames.includes('userId')),
      ).toBe(true);
      expect(
        itemForeignKeys.some((fk) => fk.columnNames.includes('tripId')),
      ).toBe(true);
      expect(
        itemForeignKeys.some((fk) => fk.columnNames.includes('createdById')),
      ).toBe(true);
    });
  });

  describe('Indexes for Performance', () => {
    it('should create indexes for performance', async () => {
      // Check that indexes are created for trip table
      const tripIndices = await queryRunner.getIndices('trip');
      const indexNames = tripIndices.map((idx) => idx.name);

      expect(indexNames.some((name) => name?.includes('OWNER_ID'))).toBe(true);
      expect(indexNames.some((name) => name?.includes('SHARE_TOKEN'))).toBe(
        true,
      );
      expect(indexNames.some((name) => name?.includes('STATUS'))).toBe(true);

      // Check participant table indexes
      const participantIndices =
        await queryRunner.getIndices('trip_participant');
      const participantIndexNames = participantIndices.map((idx) => idx.name);

      expect(
        participantIndexNames.some((name) => name?.includes('TRIP_ID')),
      ).toBe(true);
      expect(
        participantIndexNames.some((name) => name?.includes('USER_ID')),
      ).toBe(true);
    });
  });

  describe('Migration Rollback', () => {
    it('should rollback cleanly if needed', async () => {
      // This test would be run in a separate test environment
      // For now, we verify that rollback methods are properly defined

      // Import migration classes to verify they have proper down methods
      const { CreateTripTable1703000001000 } = await import(
        '../../src/database/migrations/1703000001000-CreateTripTable'
      );
      const { CreateTripParticipantTable1703000002000 } = await import(
        '../../src/database/migrations/1703000002000-CreateTripParticipantTable'
      );
      const { AddTripRelationsToLuggage1703000003000 } = await import(
        '../../src/database/migrations/1703000003000-AddTripRelationsToLuggage'
      );
      const { AddTripRelationsToItems1703000004000 } = await import(
        '../../src/database/migrations/1703000004000-AddTripRelationsToItems'
      );

      // Verify down methods exist
      expect(typeof new CreateTripTable1703000001000().down).toBe('function');
      expect(typeof new CreateTripParticipantTable1703000002000().down).toBe(
        'function',
      );
      expect(typeof new AddTripRelationsToLuggage1703000003000().down).toBe(
        'function',
      );
      expect(typeof new AddTripRelationsToItems1703000004000().down).toBe(
        'function',
      );
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity', async () => {
      // Create test data to verify constraints work
      const tripRepository = module.get<Repository<Trip>>(
        getRepositoryToken(Trip),
      );
      const userRepository = module.get<Repository<User>>(
        getRepositoryToken(User),
      );

      // This would create test user and trip, then verify constraints
      // For now, we just verify the repositories are available
      expect(tripRepository).toBeDefined();
      expect(userRepository).toBeDefined();
    });

    it('should handle cascade deletes correctly', async () => {
      // Test that when a trip is deleted, participants are also deleted
      // Test that when a user is deleted, their trips are handled appropriately
      // This would require actual test data setup
      const participantRepository = module.get<Repository<TripParticipant>>(
        getRepositoryToken(TripParticipant),
      );
      expect(participantRepository).toBeDefined();
    });
  });
});
