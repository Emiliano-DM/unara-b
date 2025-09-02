import { IsString, IsIn, IsNotEmpty, IsObject, ValidateNested, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SocialUserInfo } from '../interfaces/social-user-info.interface';

export class SocialUserInfoDto {
  @ApiProperty({
    description: 'User email address from social provider',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User ID from social provider',
    example: '1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'Subject identifier (Google, Apple)',
    example: 'google-oauth2|1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  sub?: string;

  @ApiProperty({
    description: 'Full name from social provider',
    example: 'John Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'First name from social provider',
    example: 'John',
    required: false,
  })
  @IsString()
  @IsOptional()
  given_name?: string;

  @ApiProperty({
    description: 'Last name from social provider',
    example: 'Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  family_name?: string;

  @ApiProperty({
    description: 'Profile picture URL from social provider',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  picture?: string;
}

export class SocialAuthDto {
  @ApiProperty({
    description: 'Social authentication provider',
    enum: ['google', 'facebook', 'apple', 'microsoft'],
    example: 'google',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['google', 'facebook', 'apple', 'microsoft'])
  provider: 'google' | 'facebook' | 'apple' | 'microsoft';

  @ApiProperty({
    description: 'Access token from the social provider',
    example: 'ya29.a0AfH6SMBqZ...',
  })
  @IsString()
  @IsNotEmpty()
  access_token: string;

  @ApiProperty({
    description: 'User information from the social provider',
    example: {
      id: '1234567890',
      name: 'John Doe',
      email: 'john.doe@example.com',
      picture: 'https://example.com/profile.jpg',
    },
  })
  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SocialUserInfoDto)
  user_info: SocialUserInfo;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token for generating new access token',
    example: 'refresh_token_string',
  })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
