import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { ItemCategoriesModule } from 'src/item-categories/item-categories.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [ItemsController],
  providers: [ItemsService],
  imports: [
    TypeOrmModule.forFeature([ Item ]),
    ItemCategoriesModule,
    AuthModule
  ],
  exports: [TypeOrmModule]
})
export class ItemsModule {}
