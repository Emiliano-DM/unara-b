import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseFilters } from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { FilterItemDto } from './dto/filter-item.dto';
import { DatabaseExceptionFilter } from 'src/common/filters/db-exception.filter';
import {ValidRoles} from 'src/auth/enums/valid-roles.enum';
import {Auth} from 'src/auth/decoradors/auth.decorador';

@UseFilters(new DatabaseExceptionFilter('Items'))
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @Auth(ValidRoles.admin)
  create(@Body() dto: CreateItemDto) {
    return this.itemsService.create(dto);
  }

  @Get()
  @Auth(ValidRoles.user)
  findAll(@Query() dto: FilterItemDto) {
    return this.itemsService.findAll(dto);
  }

  @Get(':id')
  @Auth(ValidRoles.user)
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.admin)
  update(
    @Param('id') id: string, 
    @Body() dto: UpdateItemDto) {
    return this.itemsService.update(id, dto);
  }

  @Delete(':id')
  @Auth(ValidRoles.admin)
  remove(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }
}
