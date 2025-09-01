import { MigrationInterface, QueryRunner, Table, Index, TableIndex } from 'typeorm';

export class CreateTripTable1703000001000 implements MigrationInterface {
  name = 'CreateTripTable1703000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'trip',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'destination',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['planning', 'active', 'completed', 'cancelled'],
            default: "'planning'",
          },
          {
            name: 'isPublic',
            type: 'boolean',
            default: false,
          },
          {
            name: 'shareToken',
            type: 'varchar',
            length: '255',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'ownerId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['ownerId'],
            referencedTableName: 'user',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes for performance
    await queryRunner.createIndex('trip', new TableIndex({
      name: 'IDX_TRIP_OWNER_ID',
      columnNames: ['ownerId'],
    }));
    
    await queryRunner.createIndex('trip', new TableIndex({
      name: 'IDX_TRIP_SHARE_TOKEN',
      columnNames: ['shareToken'],
    }));
    
    await queryRunner.createIndex('trip', new TableIndex({
      name: 'IDX_TRIP_STATUS',
      columnNames: ['status'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('trip');
  }
}