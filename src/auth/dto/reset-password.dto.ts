import {IsString, Matches, MinLength} from 'class-validator';

export class ResetPasswordDto {

  @IsString()
  passwordToken:string

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
  password:string

}