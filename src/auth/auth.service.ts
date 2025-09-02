import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { SocialAuthDto, RefreshTokenDto } from './dto/social-auth.dto';
import { SocialUserInfo } from './interfaces/social-user-info.interface';
import { SocialTokenValidatorService } from './services/social-token-validator.service';
import { AuthSecurityService } from './security/auth-security.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private socialTokenValidator: SocialTokenValidatorService,
    private authSecurity: AuthSecurityService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    user: Partial<User>;
    accessToken: string;
  }> {
    try {
      // Validate password strength
      const passwordValidation = this.authSecurity.validatePasswordStrength(registerDto.password);
      if (!passwordValidation.isValid) {
        throw new BadRequestException(`Password requirements not met: ${passwordValidation.errors.join(', ')}`);
      }

      // Sanitize input
      const sanitizedEmail = this.authSecurity.sanitizeInput(registerDto.email.toLowerCase());
      const sanitizedUsername = this.authSecurity.sanitizeInput(registerDto.username.toLowerCase());

      // Check if user already exists
      const existingUserByEmail = await this.usersService.findByEmail(sanitizedEmail);
      if (existingUserByEmail) {
        this.authSecurity.logSecurityEvent('DUPLICATE_REGISTRATION_ATTEMPT', {
          email: sanitizedEmail,
          attempt: 'email_exists',
        });
        throw new BadRequestException(
          'Registration failed. Please check your details and try again.',
        );
      }

      const existingUserByUsername = await this.usersService.findByUsername(sanitizedUsername);
      if (existingUserByUsername) {
        this.authSecurity.logSecurityEvent('DUPLICATE_REGISTRATION_ATTEMPT', {
          username: sanitizedUsername,
          attempt: 'username_exists',
        });
        throw new BadRequestException(
          'Registration failed. Please check your details and try again.',
        );
      }

      // Hash password with secure rounds
      const hashedPassword = await this.hashPassword(registerDto.password);

      // Create user
      const user = await this.usersService.create({
        ...registerDto,
        email: sanitizedEmail,
        username: sanitizedUsername,
        password: hashedPassword,
        fullname: `${registerDto.firstName || ''} ${registerDto.lastName || ''}`.trim(),
      });

      // Generate JWT token
      const payload = { email: user.email, sub: user.id };
      const accessToken = this.jwtService.sign(payload);

      this.authSecurity.logSecurityEvent('USER_REGISTERED', {
        userId: user.id,
        email: sanitizedEmail,
        method: 'email_password',
      });

      return {
        user: this.sanitizeUser(user),
        accessToken,
      };
    } catch (error) {
      this.logger.error('Registration failed:', error);
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<{
    user: Partial<User>;
    accessToken: string;
  }> {
    const sanitizedEmail = this.authSecurity.sanitizeInput(loginDto.email.toLowerCase());
    
    try {
      // Check if account is locked
      if (this.authSecurity.isAccountLocked(sanitizedEmail)) {
        this.authSecurity.logSecurityEvent('LOGIN_BLOCKED_ACCOUNT_LOCKED', {
          email: sanitizedEmail,
        });
        throw new UnauthorizedException('Account temporarily locked due to multiple failed attempts');
      }

      const user = await this.usersService.findByEmail(sanitizedEmail);

      if (!user) {
        this.authSecurity.recordFailedAttempt(sanitizedEmail);
        this.authSecurity.logSecurityEvent('LOGIN_FAILED_USER_NOT_FOUND', {
          email: sanitizedEmail,
        });
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isActive) {
        this.authSecurity.logSecurityEvent('LOGIN_FAILED_INACTIVE_ACCOUNT', {
          email: sanitizedEmail,
          userId: user.id,
        });
        throw new UnauthorizedException('Account is inactive');
      }

      // Verify password
      const isPasswordValid = await this.validatePassword(
        loginDto.password,
        user.password,
      );
      
      if (!isPasswordValid) {
        this.authSecurity.recordFailedAttempt(sanitizedEmail);
        this.authSecurity.logSecurityEvent('LOGIN_FAILED_INVALID_PASSWORD', {
          email: sanitizedEmail,
          userId: user.id,
        });
        throw new UnauthorizedException('Invalid credentials');
      }

      // Clear failed attempts on successful login
      this.authSecurity.clearFailedAttempts(sanitizedEmail);

      // Update last login
      await this.usersService.update(user.id, { lastLoginAt: new Date() });

      // Generate JWT token
      const payload = { email: user.email, sub: user.id };
      const accessToken = this.jwtService.sign(payload);

      this.authSecurity.logSecurityEvent('LOGIN_SUCCESS', {
        email: sanitizedEmail,
        userId: user.id,
        method: 'email_password',
      });

      return {
        user: this.sanitizeUser(user),
        accessToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Login failed:', error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      // Don't reveal if email exists or not
      return {
        message: 'If email exists, password reset instructions have been sent',
      };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await this.usersService.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpiresAt: resetTokenExpiry,
    });

    // In a real application, you would send email here
    // TODO: Implement email service for password reset
    this.logger.log(`Password reset token generated for: ${forgotPasswordDto.email}`);

    return {
      message:
        'If an account with that email exists, we have sent a password reset link.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(
      resetPasswordDto.token,
    );

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new BadRequestException('Reset token has expired');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(
      resetPasswordDto.newPassword,
    );

    // Update user password and clear reset token
    await this.usersService.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    });

    return { message: 'Password successfully reset' };
  }

  async socialAuth(socialAuthDto: SocialAuthDto): Promise<{
    user: Partial<User>;
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Validate the provider token with real API calls
      const isValidToken = await this.socialTokenValidator.validateToken(
        socialAuthDto.provider,
        socialAuthDto.access_token,
        socialAuthDto.user_info,
      );

      if (!isValidToken) {
        this.logger.warn(`Invalid social auth token for provider: ${socialAuthDto.provider}`);
        throw new UnauthorizedException('Invalid social authentication token');
      }

      // Extract email from user_info
      const { email } = socialAuthDto.user_info;
      if (!email) {
        this.logger.warn('Social auth attempted without email');
        throw new BadRequestException('Email is required from social provider');
      }

      // Find existing user or create new one
      let user = await this.usersService.findByEmail(email);

      if (!user) {
        // Create new user from social auth
        const hashedRandomPassword = await this.hashPassword(
          randomBytes(32).toString('hex'),
        );

        // Generate unique username
        const baseUsername = email.split('@')[0];
        const timestamp = Date.now().toString().slice(-6);
        const username = `${baseUsername}_${socialAuthDto.provider}_${timestamp}`;

        user = await this.usersService.create({
          email,
          username,
          password: hashedRandomPassword,
          fullname: socialAuthDto.user_info.name || `${socialAuthDto.provider} User`,
          firstName: socialAuthDto.user_info.given_name || 
                    socialAuthDto.user_info.name?.split(' ')[0] || 
                    'Social',
          lastName: socialAuthDto.user_info.family_name || 
                   socialAuthDto.user_info.name?.split(' ').slice(1).join(' ') || 
                   'User',
          socialProvider: socialAuthDto.provider,
          socialId: socialAuthDto.user_info.id || socialAuthDto.user_info.sub || email,
          profile_picture: socialAuthDto.user_info.picture,
        });

        this.logger.log(`New user created via ${socialAuthDto.provider}: ${email}`);
      } else if (!user.socialProvider) {
        // Link existing email account with social provider
        await this.usersService.update(user.id, {
          socialProvider: socialAuthDto.provider,
          socialId: socialAuthDto.user_info.id || socialAuthDto.user_info.sub || email,
        });
        this.logger.log(`Existing user linked with ${socialAuthDto.provider}: ${email}`);
      }

      if (!user.isActive) {
        this.logger.warn(`Inactive user attempted social auth: ${email}`);
        throw new UnauthorizedException('Account is inactive');
      }

      // Update last login
      await this.usersService.update(user.id, { lastLoginAt: new Date() });

      // Generate JWT tokens
      const payload = { email: user.email, sub: user.id };
      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

      this.logger.log(`Successful social auth for ${socialAuthDto.provider}: ${email}`);

      return {
        user: this.sanitizeUser(user),
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error(`Social auth failed for ${socialAuthDto.provider}:`, error);
      throw error;
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{
    accessToken: string;
    user: Partial<User>;
  }> {
    try {
      // Verify refresh token
      const decoded = this.jwtService.verify(refreshTokenDto.refresh_token) as any;

      if (!decoded.email || !decoded.sub) {
        this.logger.warn('Invalid refresh token payload');
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Find user
      const user = await this.usersService.findByEmail(decoded.email);
      if (!user || !user.isActive) {
        this.logger.warn(`Refresh token used for invalid/inactive user: ${decoded.email}`);
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const payload = { email: user.email, sub: user.id };
      const accessToken = this.jwtService.sign(payload);

      this.logger.log(`Token refreshed for user: ${user.email}`);

      return {
        accessToken,
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Refresh token validation failed:', error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (user && (await this.validatePassword(password, user.password))) {
      return this.sanitizeUser(user);
    }

    return null;
  }


  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  private async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  private sanitizeUser(user: User): Partial<User> {
    const {
      password,
      passwordResetToken,
      passwordResetExpiresAt,
      socialId,
      ...sanitized
    } = user;
    return sanitized;
  }
}
