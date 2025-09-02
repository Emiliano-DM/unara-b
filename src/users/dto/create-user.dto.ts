import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  fullname?: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({
    description: 'Email address (must be unique)',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Username (must be unique)',
    example: 'johndoe123',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username: string;

  @ApiProperty({
    description: 'Password',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Profile picture URL (optional)',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  profile_picture?: string;

  @ApiProperty({
    description: 'Social authentication provider',
    example: 'google',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  socialProvider?: string;

  @ApiProperty({
    description: 'Social provider user ID',
    example: '1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  socialId?: string;
}
