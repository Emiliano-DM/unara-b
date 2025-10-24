import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from 'src/mail/mail.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { User } from 'src/users/entities/user.entity';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { SocialAuthDto } from './dto/social-auth.dto';



@Injectable()
export class AuthService {

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService
  ){}

  async createAccount(registerDto:RegisterDto){

    const hashedPassword = await bcrypt.hash(registerDto.password, 10)
    const createdUser = await this.usersService.create({...registerDto, password: hashedPassword})
    const refreshToken = this.generateRefreshToken({id: createdUser.id, email: createdUser.email})
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10)

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await bcrypt.hash(verificationCode, 10)

    await this.usersService.update(createdUser.id, {
      refresh_token: hashedRefreshToken,
      emailVerificationToken: hashedCode,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      emailVerified: true // Auto-verify for Railway deployment
    })

    // Try to send email, but don't fail if SMTP is blocked
    try {
      await this.mailService.sendVerificationEmail(createdUser.email, verificationCode)
    } catch (error) {
      console.log('Email sending failed (SMTP blocked on Railway):', error.message)
    }

    return {
      id: createdUser.id,
      email: createdUser.email,
      username: createdUser.username,
      access_token: this.generateAccessToken({id:createdUser.id, email:createdUser.email}),
      refresh_token: refreshToken
    }
  }

  async accessAccount(loginDto:LoginDto){
    
    const user = await this.usersService.findByEmail(loginDto.email)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid){
      throw new UnauthorizedException('Invalid credentials')
    }

    if(!user.isEmailVerified){
      throw new UnauthorizedException('Email not verified')
    }

    if (!user.isActive){
      throw new UnauthorizedException('Invalid credentials')
    }

    const refreshToken = this.generateRefreshToken({id: user.id, email: user.email})
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10)

    await this.usersService.update(user.id, { refresh_token: hashedRefreshToken })

    return {
      id: user.id, 
      email: user.email, 
      username: user.username,
      access_token: this.generateAccessToken({id: user.id, email:user.email}),
      refresh_token: refreshToken
    }
  }

  async socialAuth(socialAuthDto: SocialAuthDto) {
    // For mobile apps, verify the access token and create/login user
    const { provider, access_token, user_info } = socialAuthDto;

    if (!user_info || !user_info.email) {
      throw new UnauthorizedException('Invalid user info from social provider');
    }

    // Find or create user
    let user = await this.usersService.findByEmail(user_info.email);
    let isNewUser = false;

    if (!user) {
      // Create new user from social auth
      user = await this.usersService.create({
        email: user_info.email,
        fullname: user_info.name || user_info.given_name || user_info.email.split('@')[0],
        username: user_info.email.split('@')[0],
        isEmailVerified: true, // Social auth emails are pre-verified
      });
      isNewUser = true;
    }

    // Generate tokens
    const payload = { email: user.email, id: user.id };
    const refreshToken = this.generateRefreshToken(payload);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.usersService.update(user.id, { refresh_token: hashedRefreshToken });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      access_token: this.generateAccessToken(payload),
      refresh_token: refreshToken,
      isNewUser
    };
  }

  async googleCallback(user:User){
    const payload = {email:user.email, id:user.id}

    const refreshToken = this.generateRefreshToken(payload)
    const hashedRefreshToken = await bcrypt.hash(refreshToken,10)
    await this.usersService.update(user.id,{refresh_token:hashedRefreshToken})
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      access_token: this.generateAccessToken(payload),
      refresh_token: refreshToken }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refresh_token } = refreshTokenDto;

    try {
    
      const payload = this.jwtService.verify(refresh_token, {
        secret: this.configService.get('JWT_REFRESH_SECRET')
      });

    
      const user = await this.usersService.findOneWithRefreshToken(payload.id); 

      if (!user.refresh_token) {
        throw new UnauthorizedException('Invalid refresh token');
      }


      const isValid = await bcrypt.compare(refresh_token, user.refresh_token);
      if (!isValid) throw new UnauthorizedException('Invalid refresh token');

      
      return {
        access_token: this.generateAccessToken({id: user.id, email: user.email})
      };

    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  } 

  async forgotPassword(forgotPasswordDto:ForgotPasswordDto){
    const user = await this.usersService.findByEmail(forgotPasswordDto.email)
    if (!user)
      return { message: 'If email exists, reset link has been sent' }
    const resetToken = this.generateAccessToken({email:user.email, id:user.id})
    const hasedResetToken = await bcrypt.hash(resetToken,10)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)    

    await this.usersService.update(user.id, {
      password_reset_token: hasedResetToken,
      password_reset_expires: expiresAt
    });

    await this.mailService.sendForgottenPasswordEmail(user.email, resetToken)
    return { message: 'If email exists, reset link has been sent', token:`${resetToken}` }
  }

  async resetPassword(resetPasswordDto:ResetPasswordDto){
    let payload: JwtPayload
    try{
      payload = this.jwtService.verify(resetPasswordDto.passwordToken);

    } catch(error){
      throw new UnauthorizedException('Invalid Token')
    }
    const user = await this.usersService.findOneWithResetToken(payload.id);

    if (!user.password_reset_token || !user.password_reset_expires)
      throw new UnauthorizedException('Invalid or expired reset token')

    const isPasswordTokenValid = await bcrypt.compare(resetPasswordDto.passwordToken, user.password_reset_token);
    if (!isPasswordTokenValid)
      throw new UnauthorizedException('Token invalid')
    if (user.password_reset_expires < new Date())
      throw new UnauthorizedException('Token expired')
    
    const hasedNewPassword = await bcrypt.hash(resetPasswordDto.password, 10)
    await this.usersService.update(user.id,{password:hasedNewPassword, password_reset_expires:null, password_reset_token:null})

    return { message: 'Password reset successful' }
  }

  async verifyEmail(verifyEmailDto:VerifyEmailDto) {
    const user = await this.usersService.findByEmail(verifyEmailDto.email)
    if (!user)
      throw new UnauthorizedException('Invalid email')

    if (!user.emailVerificationToken || !user.emailVerificationExpires)
      throw new UnauthorizedException('No verification code found')

    if (user.emailVerificationExpires < new Date())
      throw new UnauthorizedException('Code expired')

    console.log('Received code:', verifyEmailDto.code);
    console.log('Stored hash:', user.emailVerificationToken);

    const isCodeValid = await bcrypt.compare(verifyEmailDto.code, user.emailVerificationToken);
    console.log('Code valid:', isCodeValid);

    if (!isCodeValid)
      throw new UnauthorizedException('Invalid verification code')

    await this.usersService.update(user.id, {isEmailVerified:true,emailVerificationToken:null, emailVerificationExpires:null})

    return { message: 'Email verified successfully' }
  }

  async resendVerification(resendVerificaitonDto:ResendVerificationDto){
    const user = await this.usersService.findByEmail(resendVerificaitonDto.email)
    if (!user){
      throw new UnauthorizedException('Invalid credential')
    }

    // Generate new 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await bcrypt.hash(verificationCode, 10)
    await this.usersService.update(user.id, {emailVerificationToken:hashedCode,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)})

    await this.mailService.sendVerificationEmail(user.email, verificationCode)

    return {message: 'If email exists, verification email has been sent'}
  }

  async getPersonalAccountInfo(user:User){
    return {
      id: user.id, 
      email: user.email, 
      username: user.username, 
      fullname: user.fullname, 
      profile_picture: user.profile_picture, 
      isEmailVerified: user.isEmailVerified, 
      roles: user.roles, 
      createdAt: user.createdAt
    }
  }

  private generateAccessToken(payload: JwtPayload){
    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(payload: JwtPayload){
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN')
    })
  }

  private generateVerificationToken(payload: JwtPayload) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_VERIFICATION_SECRET'),
      expiresIn: '24h'
    });
  }
}
