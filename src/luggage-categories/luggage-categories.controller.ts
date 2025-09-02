import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LuggageCategoriesService } from './luggage-categories.service';
import { CreateLuggageCategoryDto } from './dto/create-luggage-category.dto';
import { UpdateLuggageCategoryDto } from './dto/update-luggage-category.dto';
import { FilterLuggageCategoryDto } from './dto/filter-luggage.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('categories')
@ApiBearerAuth('JWT-auth')
@Controller('luggage-categories')
@UseGuards(JwtAuthGuard)
export class LuggageCategoriesController {
  constructor(private readonly luggageCategoriesService: LuggageCategoriesService) {}

  @Post()
  create(@Body() createLuggageCategoryDto: CreateLuggageCategoryDto, @CurrentUser() user: User) {
    return this.luggageCategoriesService.create(createLuggageCategoryDto);
  }

  @Get()
  findAll(@Query() filterLuggageCategoryDto: FilterLuggageCategoryDto, @CurrentUser() user: User) {
    return this.luggageCategoriesService.findAll(filterLuggageCategoryDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.luggageCategoriesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateLuggageCategoryDto: UpdateLuggageCategoryDto,
    @CurrentUser() user: User) {
    return this.luggageCategoriesService.update(id, updateLuggageCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.luggageCategoriesService.remove(id);
  }
}
