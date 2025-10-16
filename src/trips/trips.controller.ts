import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe, UseFilters, UseInterceptors, UploadedFile, UploadedFiles, UsePipes } from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { FilterTripDto } from './dto/filter-trip.dto';
import { DatabaseExceptionFilter } from 'src/common/filters/db-exception.filter';
import { Auth } from 'src/auth/decoradors/auth.decorador';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { GetUser } from 'src/auth/decoradors/get-user.decorador';
import { DocumentValidation } from 'src/common/pipes/document-validation.pipe';
import { TripImageValidation } from 'src/common/pipes/trip-image-validation.pipe';
import { User } from 'src/users/entities/user.entity';

@UseFilters(new DatabaseExceptionFilter('Trips'))
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @Auth(ValidRoles.user)
  create(@Body() dto: CreateTripDto) {
    return this.tripsService.create(dto);
  }

  @Get()
  @Auth(ValidRoles.user)
  findAll(@Query() dto: FilterTripDto) {
    return this.tripsService.findAll(dto);
  }

  @Get(':id')
  @Auth(ValidRoles.user)
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.user)
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() dto: UpdateTripDto
  ) {
    return this.tripsService.update(id, dto);
  }

  @Delete(':id')
  @Auth(ValidRoles.user)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tripsService.remove(id);
  }

  @Post(':id/trip-photo')
  @Auth(ValidRoles.user)
  @UseInterceptors(FileInterceptor('image'))
  addTripPhoto(@UploadedFile(new TripImageValidation()) image:Express.Multer.File, @Param('id') tripId:string, @GetUser() user :User){
    return this.tripsService.addTripPhoto(image, tripId, user.id)
  }

  @Post(':id/documents')
  @Auth(ValidRoles.user)
  @UseInterceptors(FilesInterceptor('files', 10))
  addTripDocuments(@UploadedFiles(new DocumentValidation()) files:Express.Multer.File[], @Param('id') tripId:string, @GetUser() user:User, @Body('isPrivate') isPrivate:boolean){
    return this.tripsService.addTripDocuments(files, tripId, user.id, isPrivate)
  }
}
