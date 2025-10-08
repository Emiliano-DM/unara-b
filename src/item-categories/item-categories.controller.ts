import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe, UseFilters } from '@nestjs/common';
import { ItemCategoriesService } from './item-categories.service';
import { CreateItemCategoryDto } from './dto/create-item-category.dto';
import { UpdateItemCategoryDto } from './dto/update-item-category.dto';
import { FilterItemCategoryDto } from './dto/filter-item.dto';
import { DatabaseExceptionFilter } from 'src/common/filters/db-exception.filter';
import {ValidRoles} from 'src/auth/enums/valid-roles.enum';
import {Auth} from 'src/auth/decoradors/auth.decorador';

@UseFilters(new DatabaseExceptionFilter('ItemCategories'))
@Controller('item-categories')
export class ItemCategoriesController {
  constructor(private readonly itemCategoriesService: ItemCategoriesService) {}

  @Post()
  @Auth(ValidRoles.admin)
  create(@Body() dto: CreateItemCategoryDto) {
    return this.itemCategoriesService.create(dto);
  }

  @Get()
  @Auth(ValidRoles.user)
  findAll(@Query() dto: FilterItemCategoryDto) {
    return this.itemCategoriesService.findAll(dto);
  }

  @Get(':id')
  @Auth(ValidRoles.user)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.itemCategoriesService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.admin)
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() dto: UpdateItemCategoryDto) {
    return this.itemCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @Auth(ValidRoles.admin)
  remove(@Param('id') id: string) {
    return this.itemCategoriesService.remove(id);
  }
}
