import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  createAccount(@Body() registerDto:RegisterDto){
    return this.authService.createAccount(registerDto)
  }

  @Post('/login')
  accessAccount(@Body() loginDto:LoginDto){
    return this.authService.accessAccount(loginDto)
  }
}
