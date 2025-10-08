import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe, UseFilters } from '@nestjs/common';
import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { FilterPlaceDto } from './dto/filter-place.dto';
import { DatabaseExceptionFilter } from 'src/common/filters/db-exception.filter';

@UseFilters(new DatabaseExceptionFilter('Places'))
@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Post()
    create(@Body() dto: CreatePlaceDto) {
      return this.placesService.create( dto);
    }
  
    @Get()
    findAll(@Query() dto: FilterPlaceDto) {
      return this.placesService.findAll(dto);
    }
  
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
      return this.placesService.findOne(id);
    }
    
    @Patch(':id')
    update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() dto: UpdatePlaceDto
    ) {
      return this.placesService.update(id, dto);
    }
    
    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
      return this.placesService.remove(id);
    }
}
