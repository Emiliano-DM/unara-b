import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  Index,
  TableIndex,
} from 'typeorm';

export class AddTripRelationsToItems1703000004000
  implements MigrationInterface
{
  name = 'AddTripRelationsToItems1703000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add tripId column to item table
    await queryRunner.addColumn(
      'item',
      new TableColumn({
        name: 'tripId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Add createdById column to item table
    await queryRunner.addColumn(
      'item',
      new TableColumn({
        name: 'createdById',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Create foreign key for trip relation
    await queryRunner.createForeignKey(
      'item',
      new TableForeignKey({
        columnNames: ['tripId'],
        referencedTableName: 'trip',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_ITEM_TRIP',
      }),
    );

    // Create foreign key for user relation
    await queryRunner.createForeignKey(
      'item',
      new TableForeignKey({
        columnNames: ['createdById'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        name: 'FK_ITEM_CREATED_BY',
      }),
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'item',
      new TableIndex({
        name: 'IDX_ITEM_TRIP_ID',
        columnNames: ['tripId'],
      }),
    );

    await queryRunner.createIndex(
      'item',
      new TableIndex({
        name: 'IDX_ITEM_CREATED_BY_ID',
        columnNames: ['createdById'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('item', 'IDX_ITEM_TRIP_ID');
    await queryRunner.dropIndex('item', 'IDX_ITEM_CREATED_BY_ID');

    // Drop foreign keys
    await queryRunner.dropForeignKey('item', 'FK_ITEM_TRIP');
    await queryRunner.dropForeignKey('item', 'FK_ITEM_CREATED_BY');

    // Drop columns
    await queryRunner.dropColumn('item', 'tripId');
    await queryRunner.dropColumn('item', 'createdById');
  }
}
