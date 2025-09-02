import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsDate()
  lastLoginAt?: Date;

  @IsOptional()
  @IsString()
  passwordResetToken?: string | null;

  @IsOptional()
  @IsDate()
  passwordResetExpiresAt?: Date | null;

  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
