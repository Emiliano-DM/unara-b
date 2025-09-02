import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  Index,
  TableIndex,
} from 'typeorm';

export class AddTripRelationsToLuggage1703000003000
  implements MigrationInterface
{
  name = 'AddTripRelationsToLuggage1703000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add tripId column to luggage table
    await queryRunner.addColumn(
      'luggage',
      new TableColumn({
        name: 'tripId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add userId column to luggage table
    await queryRunner.addColumn(
      'luggage',
      new TableColumn({
        name: 'userId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Create foreign key for trip relation
    await queryRunner.createForeignKey(
      'luggage',
      new TableForeignKey({
        columnNames: ['tripId'],
        referencedTableName: 'trip',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_LUGGAGE_TRIP',
      }),
    );

    // Create foreign key for user relation
    await queryRunner.createForeignKey(
      'luggage',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_LUGGAGE_USER',
      }),
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'luggage',
      new TableIndex({
        name: 'IDX_LUGGAGE_TRIP_ID',
        columnNames: ['tripId'],
      }),
    );

    await queryRunner.createIndex(
      'luggage',
      new TableIndex({
        name: 'IDX_LUGGAGE_USER_ID',
        columnNames: ['userId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('luggage', 'IDX_LUGGAGE_TRIP_ID');
    await queryRunner.dropIndex('luggage', 'IDX_LUGGAGE_USER_ID');

    // Drop foreign keys
    await queryRunner.dropForeignKey('luggage', 'FK_LUGGAGE_TRIP');
    await queryRunner.dropForeignKey('luggage', 'FK_LUGGAGE_USER');

    // Drop columns
    await queryRunner.dropColumn('luggage', 'tripId');
    await queryRunner.dropColumn('luggage', 'userId');
  }
}
