import { Type } from "class-transformer";
import { ArrayNotEmpty, ArrayUnique, IsArray, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { IsAfter } from "src/common/validators/is-after.validator";

export class CreateTripDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    destination: string;

    @IsDate()
    @Type(() => Date)
    @IsNotEmpty()
    startDate: Date;

    @IsDate()
    @Type(() => Date)
    @IsNotEmpty()
    @IsAfter('startDate')
    endDate: Date;

    @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    @IsUUID("all", { each: true })
    userIds: string[];

    @IsNumber()
    @IsOptional()
    destination_latitude?: number

    @IsNumber()
    @IsOptional()
    destination_longitude?: number
}
