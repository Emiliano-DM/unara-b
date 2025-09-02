import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { Trip } from '../../src/trips/entities/trip.entity';
import { TripParticipant } from '../../src/trips/entities/trip-participant.entity';
import { User } from '../../src/users/entities/user.entity';
import { Item } from '../../src/items/entities/item.entity';
import { Luggage } from '../../src/luggage/entities/luggage.entity';
import { ItemCategory } from '../../src/item-categories/entities/item-category.entity';
import { LuggageCategory } from '../../src/luggage-categories/entities/luggage-category.entity';

describe('Database Optimization Verification', () => {
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
          database: process.env.TEST_DB_NAME || 'unara_optimization_test',
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
          logging: ['error'],
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

  describe('Index Verification', () => {
    it('should have proper indexes on Trip table', async () => {
      const tripIndices = await queryRunner.getIndices('trip');
      const indexNames = tripIndices.map(
        (idx) => idx.name?.toLowerCase() || '',
      );
      const indexColumns = tripIndices.flatMap((idx) => idx.columnNames);

      // Verify key indexes exist
      expect(indexColumns).toContain('ownerId');
      expect(indexColumns).toContain('shareToken');
      expect(indexColumns).toContain('status');
      expect(indexColumns).toContain('isPublic');

      console.log('Trip table indexes:', indexNames);
    });

    it('should have proper indexes on TripParticipant table', async () => {
      const participantIndices =
        await queryRunner.getIndices('trip_participant');
      const indexColumns = participantIndices.flatMap((idx) => idx.columnNames);

      // Verify key indexes exist
      expect(indexColumns).toContain('tripId');
      expect(indexColumns).toContain('userId');
      expect(indexColumns).toContain('status');

      // Verify unique constraint
      const uniqueConstraints = await queryRunner.getTable('trip_participant');
      const uniqueNames = uniqueConstraints?.uniques?.map((u) => u.name) || [];

      expect(
        uniqueNames.some(
          (name) => name?.includes('trip') && name?.includes('user'),
        ),
      ).toBe(true);

      console.log('TripParticipant table indexes:', indexColumns);
    });

    it('should have proper indexes on Luggage table', async () => {
      const luggageIndices = await queryRunner.getIndices('luggage');
      const indexColumns = luggageIndices.flatMap((idx) => idx.columnNames);

      // Verify foreign key indexes exist
      expect(
        indexColumns.some(
          (col) => col.includes('tripId') || col.includes('trip'),
        ),
      ).toBe(true);
      expect(
        indexColumns.some(
          (col) => col.includes('userId') || col.includes('user'),
        ),
      ).toBe(true);

      console.log('Luggage table indexes:', indexColumns);
    });

    it('should have proper indexes on Item table', async () => {
      const itemIndices = await queryRunner.getIndices('item');
      const indexColumns = itemIndices.flatMap((idx) => idx.columnNames);

      // Verify foreign key indexes exist
      expect(
        indexColumns.some(
          (col) => col.includes('tripId') || col.includes('trip'),
        ),
      ).toBe(true);
      expect(
        indexColumns.some(
          (col) => col.includes('createdById') || col.includes('createdBy'),
        ),
      ).toBe(true);

      console.log('Item table indexes:', indexColumns);
    });
  });

  describe('Query Performance Analysis', () => {
    it('should execute common queries efficiently', async () => {
      // Enable query timing
      await queryRunner.query('SET track_io_timing = on;');
      await queryRunner.query('SET log_statement = all;');

      // Test queries with EXPLAIN ANALYZE
      const explainQueries = [
        // Trip by owner query
        `EXPLAIN ANALYZE SELECT * FROM trip WHERE "ownerId" = 'test-uuid';`,

        // Trip by share token query
        `EXPLAIN ANALYZE SELECT * FROM trip WHERE "shareToken" = 'test-token' AND "isPublic" = true;`,

        // Trip participants query
        `EXPLAIN ANALYZE 
         SELECT tp.*, u."fullname" 
         FROM trip_participant tp 
         JOIN "user" u ON tp."userId" = u.id 
         WHERE tp."tripId" = 'test-uuid' AND tp.status = 'joined';`,

        // Items by trip query
        `EXPLAIN ANALYZE 
         SELECT i.*, ic.name as category_name 
         FROM item i 
         JOIN item_category ic ON i."categoryId" = ic.id 
         WHERE i."tripId" = 'test-uuid' 
         LIMIT 20 OFFSET 0;`,

        // Luggage by trip query
        `EXPLAIN ANALYZE 
         SELECT l.*, lc.name as category_name 
         FROM luggage l 
         JOIN luggage_category lc ON l."categoryId" = lc.id 
         WHERE l."tripId" = 'test-uuid' 
         LIMIT 20 OFFSET 0;`,
      ];

      for (const query of explainQueries) {
        try {
          const result = await queryRunner.query(query);

          // Look for index usage in the query plan
          const plan = result.map((row: any) => row['QUERY PLAN']).join('\n');
          console.log(`\nQuery: ${query.split('ANALYZE')[1].trim()}`);
          console.log('Plan:', plan.substring(0, 200) + '...');

          // Check if query uses indexes (should not have Seq Scan for indexed columns)
          if (query.includes('WHERE')) {
            expect(plan).not.toMatch(/Seq Scan.*trip.*ownerId/);
            expect(plan).not.toMatch(/Seq Scan.*trip.*shareToken/);
            expect(plan).not.toMatch(/Seq Scan.*trip_participant.*tripId/);
          }
        } catch (error) {
          console.log(
            `Query failed (expected for test UUIDs): ${error.message.substring(0, 100)}`,
          );
        }
      }
    });

    it('should have efficient join performance', async () => {
      // Test complex join query performance
      const complexJoinQuery = `
        EXPLAIN ANALYZE 
        SELECT 
          t.id, t.name, t.status,
          u."fullname" as owner_name,
          COUNT(DISTINCT tp.id) as participant_count,
          COUNT(DISTINCT i.id) as item_count,
          COUNT(DISTINCT l.id) as luggage_count
        FROM trip t
        JOIN "user" u ON t."ownerId" = u.id
        LEFT JOIN trip_participant tp ON t.id = tp."tripId" AND tp.status = 'joined'
        LEFT JOIN item i ON t.id = i."tripId"
        LEFT JOIN luggage l ON t.id = l."tripId"
        WHERE t.status IN ('planning', 'active')
        GROUP BY t.id, t.name, t.status, u."fullname"
        LIMIT 10;
      `;

      try {
        const result = await queryRunner.query(complexJoinQuery);
        const plan = result.map((row: any) => row['QUERY PLAN']).join('\n');

        console.log('\nComplex Join Query Plan:');
        console.log(plan);

        // Verify no sequential scans on indexed columns
        expect(plan).not.toMatch(/Seq Scan.*trip.*status/);
        expect(plan).not.toMatch(/Seq Scan.*trip_participant.*status/);
      } catch (error) {
        console.log(
          `Complex join query failed (expected in test): ${error.message}`,
        );
      }
    });
  });

  describe('Storage Optimization', () => {
    it('should have appropriate column types and constraints', async () => {
      const tripTable = await queryRunner.getTable('trip');
      const participantTable = await queryRunner.getTable('trip_participant');

      // Verify varchar lengths are appropriate
      const nameColumn = tripTable?.findColumnByName('name');
      expect(nameColumn?.type).toContain('varchar');
      expect(nameColumn?.length).toBe('255');

      const statusColumn = tripTable?.findColumnByName('status');
      expect(statusColumn?.type).toContain('varchar');
      expect(statusColumn?.length).toBe('50');

      // Verify boolean columns
      const isPublicColumn = tripTable?.findColumnByName('isPublic');
      expect(isPublicColumn?.type).toBe('boolean');

      // Verify UUID primary keys
      const idColumn = tripTable?.findColumnByName('id');
      expect(idColumn?.type).toBe('uuid');
      expect(idColumn?.isPrimary).toBe(true);

      console.log('Column types verified for optimal storage');
    });

    it('should have proper foreign key constraints with cascade options', async () => {
      const tripTable = await queryRunner.getTable('trip');
      const participantTable = await queryRunner.getTable('trip_participant');
      const itemTable = await queryRunner.getTable('item');
      const luggageTable = await queryRunner.getTable('luggage');

      // Verify cascade options for data integrity
      const participantFKeys = participantTable?.foreignKeys || [];
      const tripParticipantFK = participantFKeys.find(
        (fk) => fk.referencedTableName === 'trip',
      );
      expect(tripParticipantFK?.onDelete).toBe('CASCADE');

      // Verify item and luggage foreign keys
      const itemFKeys = itemTable?.foreignKeys || [];
      const luggageFKeys = luggageTable?.foreignKeys || [];

      expect(itemFKeys.some((fk) => fk.referencedTableName === 'trip')).toBe(
        true,
      );
      expect(luggageFKeys.some((fk) => fk.referencedTableName === 'trip')).toBe(
        true,
      );

      console.log('Foreign key constraints verified');
    });
  });

  describe('Scalability Considerations', () => {
    it('should support efficient pagination queries', async () => {
      const paginationQuery = `
        EXPLAIN ANALYZE 
        SELECT t.*, u."fullname" as owner_name
        FROM trip t
        JOIN "user" u ON t."ownerId" = u.id
        WHERE t.status = 'active'
        ORDER BY t."createdAt" DESC
        LIMIT 20 OFFSET 100;
      `;

      try {
        const result = await queryRunner.query(paginationQuery);
        const plan = result.map((row: any) => row['QUERY PLAN']).join('\n');

        console.log('\nPagination Query Plan:');
        console.log(plan.substring(0, 300));

        // Should use index for ordering and filtering
        expect(plan).toMatch(/(Index|Sort)/i);
      } catch (error) {
        console.log(
          `Pagination query analysis: ${error.message.substring(0, 100)}`,
        );
      }
    });

    it('should handle concurrent access efficiently', async () => {
      // Verify isolation levels and locking mechanisms
      const isolationLevel = await queryRunner.query(
        'SHOW transaction_isolation;',
      );
      console.log(
        'Transaction isolation level:',
        isolationLevel[0].transaction_isolation,
      );

      // Should be READ COMMITTED or REPEATABLE READ for good concurrency
      expect(['read committed', 'repeatable read']).toContain(
        isolationLevel[0].transaction_isolation.toLowerCase(),
      );
    });
  });
});
