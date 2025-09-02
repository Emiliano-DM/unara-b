import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ItemCategoriesService } from './item-categories.service';
import { CreateItemCategoryDto } from './dto/create-item-category.dto';
import { UpdateItemCategoryDto } from './dto/update-item-category.dto';
import { FilterItemCategoryDto } from './dto/filter-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('categories')
@ApiBearerAuth('JWT-auth')
@Controller('item-categories')
@UseGuards(JwtAuthGuard)
export class ItemCategoriesController {
  constructor(private readonly itemCategoriesService: ItemCategoriesService) {}

  @Post()
  create(@Body() createItemCategoryDto: CreateItemCategoryDto, @CurrentUser() user: User) {
    return this.itemCategoriesService.create(createItemCategoryDto);
  }

  @Get()
  findAll(@Query() filterItemCategoryDto: FilterItemCategoryDto, @CurrentUser() user: User) {
    return this.itemCategoriesService.findAll(filterItemCategoryDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.itemCategoriesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateItemCategoryDto: UpdateItemCategoryDto,
    @CurrentUser() user: User) {
    return this.itemCategoriesService.update(id, updateItemCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.itemCategoriesService.remove(id);
  }
}
