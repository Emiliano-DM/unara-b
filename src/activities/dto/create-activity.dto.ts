import { Type } from "class-transformer";
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateActivityDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string

    @IsOptional()
    @IsString()
    description?: string

    @IsDate()
    @Type(() => Date)
    date: Date

    @IsUUID()
    @IsNotEmpty()
    tripId: string

    @IsOptional()
    @IsUUID()
    placeId?: string

    @IsUUID()
    @IsNotEmpty()
    userId: string
}
