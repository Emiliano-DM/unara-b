import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { FilesService } from './files.service';
import { GetUser } from 'src/auth/decoradors/get-user.decorador';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { Auth } from 'src/auth/decoradors/auth.decorador';
import { User } from 'src/users/entities/user.entity';



@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService
  ) {}

  @Get()
  @Auth(ValidRoles.user)
  getFiles(
    @GetUser() user: User,
    @Query('tripId') tripId?: string,
    @Query('category') category?: string,
    @Query('transportType') transportType?: string
  ){
    if (tripId) {
      return this.filesService.getTripFiles(tripId, category, transportType);
    }
    return this.filesService.getUserFiles(user.id);
  }

  @Get('my-files')
  @Auth(ValidRoles.user)
  getMyFiles(@GetUser() user: User){
    return this.filesService.getUserFiles(user.id)
  }

  @Delete(':id')
  @Auth(ValidRoles.user)
  deleteFileComplete(@Param('id') fileId: string, @GetUser() user:User){
    return this.filesService.deleteFileComplete(fileId, user.id)
  }
}
