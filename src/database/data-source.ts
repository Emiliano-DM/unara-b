import { DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';

// Load environment variables
ConfigModule.forRoot();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
  logging: false,
  synchronize: false,
});
