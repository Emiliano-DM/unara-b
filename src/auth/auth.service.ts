import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/users/entities/user.entity';


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
      access_token: this.generateToken(createdUser.id, createdUser.email)
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
      access_token: this.generateToken(user.id, user.email)
    }
  }

  private generateToken(userId:string, email:string){
    return this.jwtService.sign({ sub: userId, email });
  }
}
