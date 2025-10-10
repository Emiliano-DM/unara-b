import { Controller, Post, Body, Get} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GetUser } from './decoradors/get-user.decorador';
import { User } from 'src/users/entities/user.entity';
import { ValidRoles } from './enums/valid-roles.enum';
import { Auth } from './decoradors/auth.decorador';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';


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

  @Post('/logout')
  @Auth(ValidRoles.user)
  logout() {
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto:ForgotPasswordDto){
    return this.authService.forgotPassword(forgotPasswordDto)
  }

  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto:ResetPasswordDto){
    return this.authService.resetPassword(resetPasswordDto)
  }

  @Post('verify-email')
  verifyEmail(@Body() verifyEmailDto:VerifyEmailDto ){
    return this.authService.verifyEmail(verifyEmailDto)
  }

  @Post('resend-verification-email')
  resendVerificationEmail(@Body() resendVerificationDto: ResendVerificationDto){
    return this.authService.resendVerification(resendVerificationDto)
  }

  @Get('user/me')
  @Auth(ValidRoles.user)
  getPersonalInfo(@GetUser() user:User){
    return this.authService.getPersonalAccountInfo(user)
  }
}
