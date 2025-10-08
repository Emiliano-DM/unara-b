import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query, UseFilters } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { DatabaseExceptionFilter } from 'src/common/filters/db-exception.filter';
import { Auth } from 'src/auth/decoradors/auth.decorador';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';

@UseFilters(new DatabaseExceptionFilter('Users'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @Auth(ValidRoles.admin)
  findAll(@Query() dto: FilterUserDto) {
    return this.usersService.findAll(dto);
  }

  @Get(':id')
  @Auth(ValidRoles.admin)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('search/:term')
  @Auth(ValidRoles.user)
  findOnePublic(@Param('term') term:string){
    return this.usersService.findOnePublic(term)
  }

  @Patch(':id')
  @Auth(ValidRoles.user)
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Auth(ValidRoles.admin)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
