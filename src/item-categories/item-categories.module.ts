import { Module } from '@nestjs/common';
import { ItemCategoriesService } from './item-categories.service';
import { ItemCategoriesController } from './item-categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemCategory } from './entities/item-category.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [ItemCategoriesController],
  providers: [ItemCategoriesService],
  imports: [
    TypeOrmModule.forFeature([ItemCategory]),
    AuthModule
  ],
  exports: [TypeOrmModule],
})
export class ItemCategoriesModule {}
