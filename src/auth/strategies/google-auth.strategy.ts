import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from 'passport-google-oauth20';
import {User} from 'src/users/entities/user.entity';
import {ConfigService} from '@nestjs/config';
import {Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import { UsersService } from "src/users/users.service";

@Injectable()
export class GoogleAuthStrategy extends PassportStrategy(Strategy, 'google'){
  constructor(
    configService:ConfigService,
    private readonly userServices: UsersService
  ){
    if (!configService.get('GOOGLE_CLIENT_ID') || !configService.get('GOOGLE_CLIENT_SECRET') || !configService.get('GOOGLE_CALLBACK_URL')){
      throw new Error('GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_CALLBACK_URL must be defined')
    }
    super({
      clientId: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email','profile']
    })
  }

  async validate(accessToken: string, refreshToken: string, profile:any) : Promise<User>{
    let user = await this.userServices.findByEmail(profile.emails[0].value)
    if (!user){
      return  this.userServices.create({
      email: profile.emails[0].value,
      fullname: profile.displayName,
      username: profile.emails[0].value.split('@')[0],
      isEmailVerified:true,
      })
    }
    return user
  }
}