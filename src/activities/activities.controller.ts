import { Controller, Get, Post, Body, Patch, Param, Delete, UseFilters, Query, ParseUUIDPipe } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { DatabaseExceptionFilter } from 'src/common/filters/db-exception.filter';
import { FilterActivityDto } from './dto/filter-activity.dto';
import {ValidRoles} from 'src/auth/enums/valid-roles.enum';
import {Auth} from 'src/auth/decoradors/auth.decorador';

@UseFilters(new DatabaseExceptionFilter('Activities'))
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @Auth(ValidRoles.user)
  create(@Body() dto: CreateActivityDto) {
    return this.activitiesService.create(dto);
  }

  @Get()
  @Auth(ValidRoles.user)
  findAll(@Query() dto: FilterActivityDto) {
    return this.activitiesService.findAll(dto);
  }

  @Get(':id')
  @Auth(ValidRoles.user)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.activitiesService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.user)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActivityDto
  ) {
    return this.activitiesService.update(id, dto);
  }

  @Delete(':id')
  @Auth(ValidRoles.user)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.activitiesService.remove(id);
  }
}
