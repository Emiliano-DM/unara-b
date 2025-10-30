import { IsEmail, IsString, Matches, MinLength, IsOptional, IsDateString } from "class-validator";

export class RegisterDto {

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  username: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
  password: string;

  @IsString()
  @MinLength(2)
  fullname: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  profile_picture?: string;

}