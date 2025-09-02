import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { SocialAuthDto, RefreshTokenDto } from './dto/social-auth.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUserByEmail = await this.usersService.findByEmail(registerDto.email);
    if (existingUserByEmail) {
      throw new BadRequestException('Registration failed. Please check your details and try again.');
    }

    const existingUserByUsername = await this.usersService.findByUsername(registerDto.username);
    if (existingUserByUsername) {
      throw new BadRequestException('Registration failed. Please check your details and try again.');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(registerDto.password);

    // Create user
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      fullname: `${registerDto.firstName} ${registerDto.lastName}`,
    });

    // Generate JWT token
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await this.validatePassword(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.usersService.update(user.id, { lastLoginAt: new Date() });

    // Generate JWT token
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    
    if (!user) {
      // Don't reveal if email exists or not
      return { message: 'If email exists, password reset instructions have been sent' };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await this.usersService.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpiresAt: resetTokenExpiry,
    });

    // In a real application, you would send email here
    // For now, log token for development (never do this in production)
    console.log(`Password reset token for ${forgotPasswordDto.email}: ${resetToken}`);
    
    return { 
      message: 'If an account with that email exists, we have sent a password reset link.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(resetPasswordDto.token);
    
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(resetPasswordDto.newPassword);

    // Update user password and clear reset token
    await this.usersService.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    });

    return { message: 'Password successfully reset' };
  }

  async socialAuth(socialAuthDto: SocialAuthDto) {
    // Validate the provider token (this is a simplified version)
    const isValidToken = await this.validateSocialToken(
      socialAuthDto.provider,
      socialAuthDto.access_token,
      socialAuthDto.user_info
    );

    if (!isValidToken) {
      throw new UnauthorizedException('Invalid social auth token');
    }

    // Extract email from user_info
    const email = socialAuthDto.user_info.email;
    if (!email) {
      throw new BadRequestException('Email is required from social provider');
    }

    // Find existing user or create new one
    let user = await this.usersService.findByEmail(email);
    
    if (!user) {
      // Create new user from social auth
      const hashedRandomPassword = await this.hashPassword(randomBytes(32).toString('hex'));
      user = await this.usersService.create({
        email: email,
        username: socialAuthDto.user_info.email.split('@')[0] + '_' + socialAuthDto.provider,
        password: hashedRandomPassword, // Random password since they'll use social login
        fullname: socialAuthDto.user_info.name || 'Social User',
        firstName: socialAuthDto.user_info.given_name || socialAuthDto.user_info.name?.split(' ')[0] || 'Social',
        lastName: socialAuthDto.user_info.family_name || socialAuthDto.user_info.name?.split(' ').slice(1).join(' ') || 'User',
        socialProvider: socialAuthDto.provider,
        socialId: socialAuthDto.user_info.id || socialAuthDto.user_info.sub,
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Update last login
    await this.usersService.update(user.id, { lastLoginAt: new Date() });

    // Generate JWT token with refresh token
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      // Verify refresh token
      const decoded = this.jwtService.verify(refreshTokenDto.refresh_token);
      
      // Find user
      const user = await this.usersService.findByEmail(decoded.email);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const payload = { email: user.email, sub: user.id };
      const accessToken = this.jwtService.sign(payload);

      return {
        accessToken,
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    
    if (user && await this.validatePassword(password, user.password)) {
      return this.sanitizeUser(user);
    }
    
    return null;
  }

  private async validateSocialToken(provider: string, accessToken: string, userInfo: any): Promise<boolean> {
    // In a real implementation, you would validate the token with the provider's API
    // For now, we'll do basic validation
    switch (provider) {
      case 'google':
        return this.validateGoogleToken(accessToken, userInfo);
      case 'facebook':
        return this.validateFacebookToken(accessToken, userInfo);
      case 'apple':
        return this.validateAppleToken(accessToken, userInfo);
      case 'microsoft':
        return this.validateMicrosoftToken(accessToken, userInfo);
      default:
        return false;
    }
  }

  private async validateGoogleToken(accessToken: string, userInfo: any): Promise<boolean> {
    // In production, verify with Google's token validation endpoint
    // For now, just check if required fields exist
    return !!(userInfo.email && userInfo.sub && accessToken);
  }

  private async validateFacebookToken(accessToken: string, userInfo: any): Promise<boolean> {
    // In production, verify with Facebook's token validation endpoint
    return !!(userInfo.email && userInfo.id && accessToken);
  }

  private async validateAppleToken(accessToken: string, userInfo: any): Promise<boolean> {
    // In production, verify with Apple's token validation endpoint
    return !!(userInfo.email && userInfo.sub && accessToken);
  }

  private async validateMicrosoftToken(accessToken: string, userInfo: any): Promise<boolean> {
    // In production, verify with Microsoft's token validation endpoint
    return !!(userInfo.email && userInfo.id && accessToken);
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  private async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  private sanitizeUser(user: any) {
    const { password, passwordResetToken, passwordResetExpiresAt, ...sanitized } = user;
    return sanitized;
  }
}