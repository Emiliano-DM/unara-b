import {
  MigrationInterface,
  QueryRunner,
  Table,
  Index,
  TableIndex,
} from 'typeorm';

export class CreateTripParticipantTable1703000002000
  implements MigrationInterface
{
  name = 'CreateTripParticipantTable1703000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'trip_participant',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'tripId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['owner', 'admin', 'participant'],
            default: "'participant'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'joined', 'declined', 'removed'],
            default: "'pending'",
          },
          {
            name: 'invitedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'joinedAt',
            type: 'timestamp',
            isNullable: true,
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
            columnNames: ['tripId'],
            referencedTableName: 'trip',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['userId'],
            referencedTableName: 'user',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        uniques: [
          {
            name: 'UQ_TRIP_PARTICIPANT_TRIP_USER',
            columnNames: ['tripId', 'userId'],
          },
        ],
      }),
      true,
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'trip_participant',
      new TableIndex({
        name: 'IDX_TRIP_PARTICIPANT_TRIP_ID',
        columnNames: ['tripId'],
      }),
    );

    await queryRunner.createIndex(
      'trip_participant',
      new TableIndex({
        name: 'IDX_TRIP_PARTICIPANT_USER_ID',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'trip_participant',
      new TableIndex({
        name: 'IDX_TRIP_PARTICIPANT_STATUS',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('trip_participant');
  }
}
