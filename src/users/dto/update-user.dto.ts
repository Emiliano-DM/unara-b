import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  refresh_token?: string
  password_reset_token?: string | null
  password_reset_expires?: Date | null
}
