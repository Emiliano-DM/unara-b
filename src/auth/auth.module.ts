import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SocialTokenValidatorService } from './services/social-token-validator.service';
import { AuthSecurityService } from './security/auth-security.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error(
            'JWT_SECRET must be defined in environment variables',
          );
        }
        return {
          secret,
          signOptions: {
            algorithm: 'HS256' as const,
            expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '15m',
          },
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SocialTokenValidatorService, AuthSecurityService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
