import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LuggageModule } from './luggage/luggage.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './users/users.module';
import { ItemsModule } from './items/items.module';
import { ItemCategoriesModule } from './item-categories/item-categories.module';
import { TripsModule } from './trips/trips.module';
import { PlacesModule } from './places/places.module';
import { ActivitiesModule } from './activities/activities.module';
import { AuthModule } from './auth/auth.module';
import { SeedModule } from './seed/seed.module';
import { MailModule } from './mail/mail.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { FilesModule } from './files/files.module';
import { SurveysModule } from './surveys/surveys.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal:true}),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
    }),

    LuggageModule,

    CommonModule,

    UsersModule,

    ItemsModule,

    ItemCategoriesModule,

    TripsModule,

    PlacesModule,

    ActivitiesModule,

    AuthModule,

    SeedModule,

    MailModule,

    CloudinaryModule,

    FilesModule,

    SurveysModule,

    EventsModule
  ],
})
export class AppModule {}
