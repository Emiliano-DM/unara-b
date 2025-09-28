import { ArrayNotEmpty, ArrayUnique, IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator"


export class CreateLuggageDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @IsUUID()
    @IsOptional()
    tripId: string

    @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    @IsUUID("all", { each: true })
    userIds: string[];
}
