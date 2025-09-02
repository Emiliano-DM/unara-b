import { IsString, IsIn, IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SocialAuthDto {
  @ApiProperty({
    description: 'Social authentication provider',
    enum: ['google', 'facebook', 'apple', 'microsoft'],
    example: 'google'
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['google', 'facebook', 'apple', 'microsoft'])
  provider: 'google' | 'facebook' | 'apple' | 'microsoft';

  @ApiProperty({
    description: 'Access token from the social provider',
    example: 'ya29.a0AfH6SMBqZ...'
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
      picture: 'https://example.com/profile.jpg'
    }
  })
  @IsObject()
  @IsNotEmpty()
  user_info: any;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token for generating new access token',
    example: 'refresh_token_string'
  })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}