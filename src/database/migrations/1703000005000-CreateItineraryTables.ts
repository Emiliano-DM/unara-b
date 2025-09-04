import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateItineraryTables1703000005000 implements MigrationInterface {
  name = 'CreateItineraryTables1703000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create TripStatus enum
    await queryRunner.query(`
      CREATE TYPE "trip_status_enum" AS ENUM('planning', 'confirmed', 'in_progress', 'completed', 'cancelled')
    `);

    // Create ParticipantRole enum
    await queryRunner.query(`
      CREATE TYPE "participant_role_enum" AS ENUM('owner', 'organizer', 'participant')
    `);

    // Create ParticipantStatus enum
    await queryRunner.query(`
      CREATE TYPE "participant_status_enum" AS ENUM('invited', 'accepted', 'declined', 'left')
    `);

    // Create ItemStatus enum
    await queryRunner.query(`
      CREATE TYPE "item_status_enum" AS ENUM('pending', 'assigned', 'packed', 'unpacked')
    `);

    // Create Itinerary table
    await queryRunner.query(`
      CREATE TABLE "itinerary" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "tripId" uuid,
        CONSTRAINT "PK_da209353a3d8f5d4ff1e43ef3b9" PRIMARY KEY ("id")
      )
    `);

    // Create ItineraryDay table
    await queryRunner.query(`
      CREATE TABLE "itinerary_day" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "date" date NOT NULL,
        "dayNumber" integer NOT NULL,
        "title" character varying(255) NOT NULL,
        "itineraryId" uuid,
        CONSTRAINT "PK_itinerary_day_id" PRIMARY KEY ("id")
      )
    `);

    // Create index on itinerary_day date
    await queryRunner.query(`
      CREATE INDEX "IDX_itinerary_day_date" ON "itinerary_day" ("date")
    `);

    // Create ItineraryActivity table
    await queryRunner.query(`
      CREATE TABLE "itinerary_activity" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "startTime" time,
        "endTime" time,
        "title" character varying(255) NOT NULL,
        "description" text,
        "location" character varying(255),
        "coordinates" json,
        "dayId" uuid,
        CONSTRAINT "PK_itinerary_activity_id" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "itinerary" 
      ADD CONSTRAINT "FK_itinerary_trip" 
      FOREIGN KEY ("tripId") REFERENCES "trip"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "itinerary_day" 
      ADD CONSTRAINT "FK_itinerary_day_itinerary" 
      FOREIGN KEY ("itineraryId") REFERENCES "itinerary"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "itinerary_activity" 
      ADD CONSTRAINT "FK_itinerary_activity_day" 
      FOREIGN KEY ("dayId") REFERENCES "itinerary_day"("id") 
      ON DELETE CASCADE
    `);

    // Update Trip table to use enum and add new columns
    await queryRunner.query(`
      ALTER TABLE "trip" 
      ALTER COLUMN "status" TYPE "trip_status_enum" 
      USING "status"::text::"trip_status_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "trip" 
      ADD COLUMN "maxParticipants" integer,
      ADD COLUMN "version" integer NOT NULL DEFAULT 1,
      ADD COLUMN "lastModified" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN "lastModifiedBy" uuid
    `);

    // Update TripParticipant table to use enums
    await queryRunner.query(`
      ALTER TABLE "trip_participant" 
      ALTER COLUMN "role" TYPE "participant_role_enum" 
      USING "role"::text::"participant_role_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "trip_participant" 
      ALTER COLUMN "status" TYPE "participant_status_enum" 
      USING "status"::text::"participant_status_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "itinerary_activity" DROP CONSTRAINT "FK_itinerary_activity_day"`);
    await queryRunner.query(`ALTER TABLE "itinerary_day" DROP CONSTRAINT "FK_itinerary_day_itinerary"`);
    await queryRunner.query(`ALTER TABLE "itinerary" DROP CONSTRAINT "FK_itinerary_trip"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "itinerary_activity"`);
    await queryRunner.query(`DROP INDEX "IDX_itinerary_day_date"`);
    await queryRunner.query(`DROP TABLE "itinerary_day"`);
    await queryRunner.query(`DROP TABLE "itinerary"`);

    // Revert Trip table changes
    await queryRunner.query(`
      ALTER TABLE "trip" 
      DROP COLUMN "lastModifiedBy",
      DROP COLUMN "lastModified",
      DROP COLUMN "version",
      DROP COLUMN "maxParticipants"
    `);

    await queryRunner.query(`
      ALTER TABLE "trip" 
      ALTER COLUMN "status" TYPE character varying(50) 
      USING "status"::text
    `);

    // Revert TripParticipant table changes
    await queryRunner.query(`
      ALTER TABLE "trip_participant" 
      ALTER COLUMN "status" TYPE character varying(50) 
      USING "status"::text
    `);

    await queryRunner.query(`
      ALTER TABLE "trip_participant" 
      ALTER COLUMN "role" TYPE character varying(50) 
      USING "role"::text
    `);

    // Drop enums
    await queryRunner.query(`DROP TYPE "item_status_enum"`);
    await queryRunner.query(`DROP TYPE "participant_status_enum"`);
    await queryRunner.query(`DROP TYPE "participant_role_enum"`);
    await queryRunner.query(`DROP TYPE "trip_status_enum"`);
  }
}