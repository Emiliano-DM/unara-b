import { Module } from '@nestjs/common';
import { LuggageService } from './services/luggage.service';
import { LuggageController } from './controllers/luggage.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Luggage } from './entities/luggage.entity';
import { LuggageItemsController } from './controllers/luggage-items.controller';
import { LuggageItemsService } from './services/luggage-items.service';
import { LuggageItem } from './entities/luggage-item.entity';
import { ItemsModule } from 'src/items/items.module';
import { Trip } from 'src/trips/entities/trip.entity';
import { User } from 'src/users/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [
    LuggageController,
    LuggageItemsController,
  ],
  providers: [
    LuggageService,
    LuggageItemsService,
  ],
  imports: [
    TypeOrmModule.forFeature([ 
      Luggage,
      LuggageItem,
      Trip,
      User,
    ]),
    ItemsModule,
    AuthModule
  ]
})
export class LuggageModule {}
