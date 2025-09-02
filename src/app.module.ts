import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LuggageModule } from './luggage/luggage.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './users/users.module';
import { ItemsModule } from './items/items.module';
import { LuggageCategoriesModule } from './luggage-categories/luggage-categories.module';
import { ItemCategoriesModule } from './item-categories/item-categories.module';
import { TripsModule } from './trips/trips.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),

    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // max 3 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20, // max 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 60 seconds
        limit: 100, // max 100 requests per minute
      },
    ]),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: false, // Temporarily disabled to fix null username issue
      migrationsRun: process.env.NODE_ENV === 'production',
      migrations: ['dist/database/migrations/*.js'],
    }),

    LuggageModule,

    CommonModule,

    UsersModule,

    ItemsModule,

    LuggageCategoriesModule,

    ItemCategoriesModule,

    TripsModule,

    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
