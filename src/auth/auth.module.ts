import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    ConfigModule,

    TypeOrmModule.forFeature([User]),
    
    PassportModule.register({defaultStrategy:'jwt'}),

    JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      if (!configService.get('JWT_ACCESS_SECRET') || !configService.get('JWT_ACCESS_EXPIRES_IN')){
        throw new Error('JWT_ACCESS_SECRET and JWT_ACCESS_EXPIRES_IN must be defined in environment variables');
      }
      return {
      secret: configService.get('JWT_ACCESS_SECRET'),
      signOptions: { expiresIn: configService.get('JWT_ACCESS_EXPIRES_IN') }
      }
    }
  }),
    UsersModule
  ],
  exports: [TypeOrmModule, JwtStrategy, PassportModule, JwtModule]
})
export class AuthModule {}
