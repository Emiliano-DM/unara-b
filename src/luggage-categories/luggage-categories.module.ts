import { Module } from '@nestjs/common';
import { LuggageCategoriesService } from './luggage-categories.service';
import { LuggageCategoriesController } from './luggage-categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LuggageCategory } from './entities/luggage-category.entity';

@Module({
  controllers: [LuggageCategoriesController],
  providers: [LuggageCategoriesService],
  imports: [TypeOrmModule.forFeature([LuggageCategory])],
  exports: [TypeOrmModule],
})
export class LuggageCategoriesModule {}
