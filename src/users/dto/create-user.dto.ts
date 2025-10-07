import { IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator"
import { ValidRoles } from "src/auth/enums/valid-roles.enum"

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    fullname: string

    @IsEmail()
    @MaxLength(255)
    email: string
    
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    username: string

    @IsString()
    @IsNotEmpty()
    password: string

    @IsString()
    @IsOptional()
    profile_picture?: string

    @IsArray()
    @IsEnum(ValidRoles, {each: true})
    @IsOptional()
    roles?: string[]
}
