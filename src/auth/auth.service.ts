import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';



@Injectable()
export class AuthService {

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ){}

  async createAccount(registerDto:RegisterDto){
    
    const hashedPassword = await bcrypt.hash(registerDto.password, 10)
    const createdUser = await this.usersService.create({...registerDto, password: hashedPassword})

    return {
      id: createdUser.id, 
      email: createdUser.email, 
      username: createdUser.username, 
      access_token: this.generateToken({id:createdUser.id, email:createdUser.email})
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

    return {
      id: user.id, 
      email: user.email, 
      username: user.username,
      access_token: this.generateToken({id: user.id, email:user.email})
    }
  }

  private generateToken(payload: JwtPayload){
    return this.jwtService.sign(payload);
  }
}
