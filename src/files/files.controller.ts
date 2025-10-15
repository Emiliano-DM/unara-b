import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FilesService } from './files.service';
import { GetUser } from 'src/auth/decoradors/get-user.decorador';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { Auth } from 'src/auth/decoradors/auth.decorador';



@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService
  ) {}
  
  @Delete(':id')
  @Auth(ValidRoles.user)
  deleteFileComplete(@Param('id') fileId: string, @GetUser() userId:string){
    return this.filesService.deleteFileComplete(fileId, userId)
  }
}
