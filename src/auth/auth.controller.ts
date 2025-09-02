import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { SocialAuthDto, RefreshTokenDto } from './dto/social-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AuthThrottle } from './decorators/auth-throttler.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User registered successfully' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-string' },
            email: { type: 'string', example: 'user@example.com' },
            username: { type: 'string', example: 'username' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or user already exists' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Post('register')
  @AuthThrottle()
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'jwt-token-string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-string' },
            email: { type: 'string', example: 'user@example.com' },
            username: { type: 'string', example: 'username' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Post('login')
  @AuthThrottle()
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully',
    type: User 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return user;
  }

  @ApiOperation({ summary: 'Request password reset token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset token sent to email',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password reset token sent to email' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Post('forgot-password')
  @AuthThrottle()
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Password reset successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password reset successful' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Post('reset-password')
  @AuthThrottle()
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }

  @ApiOperation({ summary: 'Authenticate using social provider' })
  @ApiResponse({ 
    status: 200, 
    description: 'Social authentication successful',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'jwt-token-string' },
        refresh_token: { type: 'string', example: 'refresh-token-string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-string' },
            email: { type: 'string', example: 'user@example.com' },
            username: { type: 'string', example: 'username' },
            socialProvider: { type: 'string', example: 'google' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid provider data' })
  @ApiResponse({ status: 401, description: 'Invalid social auth token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Post('social')
  @AuthThrottle()
  async socialAuth(@Body() socialAuthDto: SocialAuthDto) {
    return await this.authService.socialAuth(socialAuthDto);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refresh successful',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'new-jwt-token-string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-string' },
            email: { type: 'string', example: 'user@example.com' },
            username: { type: 'string', example: 'username' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @Post('refresh')
  @AuthThrottle()
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto);
  }
}