import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LuggageService } from '../services/luggage.service';
import { CreateLuggageDto } from '../dto/create-luggage.dto';
import { UpdateLuggageDto } from '../dto/update-luggage.dto';
import { FilterLuggageDto } from '../dto/filter-luggage.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@ApiTags('luggage')
@ApiBearerAuth('JWT-auth')
@Controller('luggage')
@UseGuards(JwtAuthGuard)
export class LuggageController {
  constructor(private readonly luggageService: LuggageService) {}

  @Post()
  create(@Body() createLuggageDto: CreateLuggageDto, @CurrentUser() user: User) {
    return this.luggageService.create(createLuggageDto);
  }

  @Get()
  findAll(@Query() filterLuggageDto: FilterLuggageDto, @CurrentUser() user: User) {
    return this.luggageService.findAll(filterLuggageDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.luggageService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateLuggageDto: UpdateLuggageDto,
    @CurrentUser() user: User) {
    return this.luggageService.update(id, updateLuggageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.luggageService.remove(id);
  }
}
