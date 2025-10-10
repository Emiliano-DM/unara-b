import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsDate, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  refresh_token?: string

  @IsString()
  password_reset_token?: string | null

  @IsDate()
  password_reset_expires?: Date | null

  @IsString()
  emailVerificationToken?: string | null

  @IsDate()
  emailVerificationExpires?: Date | null


}
