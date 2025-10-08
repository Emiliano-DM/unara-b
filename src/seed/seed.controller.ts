import {
  Controller,
  Get,
} from '@nestjs/common';
import { SeedService } from './seed.service';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { Auth } from 'src/auth/decoradors/auth.decorador';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get()
  @Auth(ValidRoles.admin)
  executeSeed(){
    return this.seedService.runSeed()
  }
}
