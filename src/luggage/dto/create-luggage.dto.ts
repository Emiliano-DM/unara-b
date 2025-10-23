import { ArrayNotEmpty, ArrayUnique, IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator"


export class CreateLuggageDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @IsBoolean()
    @IsOptional()
    is_shared?: boolean

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    notes?: string[]

    @IsUUID()
    @IsOptional()
    tripId: string

    @IsUUID()
    @IsNotEmpty()
    userId: string;
}
