import { IsString, IsNotEmpty, MaxLength, IsOptional, IsDate, IsBoolean } from "class-validator";
import { Type } from "class-transformer";

export class CreateTripDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    destination?: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    startDate?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    endDate?: Date;

    @IsOptional()
    @IsBoolean()
    isPublic?: boolean;
}