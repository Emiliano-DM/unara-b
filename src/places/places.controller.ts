import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe, UseFilters } from '@nestjs/common';
import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { FilterPlaceDto } from './dto/filter-place.dto';
import { DatabaseExceptionFilter } from 'src/common/filters/db-exception.filter';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { Auth } from 'src/auth/decoradors/auth.decorador';

@UseFilters(new DatabaseExceptionFilter('Places'))
@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Post()
  @Auth(ValidRoles.user)
    create(@Body() dto: CreatePlaceDto) {
      return this.placesService.create( dto);
    }
  
    @Get()
    @Auth(ValidRoles.user)
    findAll(@Query() dto: FilterPlaceDto) {
      return this.placesService.findAll(dto);
    }
  
    @Get(':id')
    @Auth(ValidRoles.user)
    findOne(@Param('id', ParseUUIDPipe) id: string) {
      return this.placesService.findOne(id);
    }
    
    @Patch(':id')
    @Auth(ValidRoles.user)
    update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() dto: UpdatePlaceDto
    ) {
      return this.placesService.update(id, dto);
    }
    
    @Delete(':id')
    @Auth(ValidRoles.user)
    remove(@Param('id', ParseUUIDPipe) id: string) {
      return this.placesService.remove(id);
    }
}
