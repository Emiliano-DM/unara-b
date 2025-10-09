import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenDto } from './dto/refresh-token.dto';



@Injectable()
export class AuthService {

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ){}

  async createAccount(registerDto:RegisterDto){
    
    const hashedPassword = await bcrypt.hash(registerDto.password, 10)
    const createdUser = await this.usersService.create({...registerDto, password: hashedPassword})
    const refreshToken = this.generateRefreshToken({id: createdUser.id, email: createdUser.email})
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10)

    await this.usersService.update(createdUser.id, { refresh_token: hashedRefreshToken })

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

  private generateAccessToken(payload: JwtPayload){
    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(payload: JwtPayload){
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN')
    })
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
}
