import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreatePlaceDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    latitude: number;

    @IsNotEmpty()
    @IsNumber()
    @Type(() => Number)
    longitude: number;

    @IsUUID()
    @IsNotEmpty()
    tripId: string;

    @IsUUID()
    @IsNotEmpty()
    userId: string;
}
