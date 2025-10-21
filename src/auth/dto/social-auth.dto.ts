import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum SocialProvider {
  GOOGLE = 'google',
  APPLE = 'apple'
}

export class SocialAuthDto {
  @IsEnum(SocialProvider)
  @IsNotEmpty()
  provider: SocialProvider;

  @IsString()
  @IsNotEmpty()
  access_token: string;

  @IsObject()
  @IsOptional()
  user_info?: {
    email?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    id?: string;
  };
}
