import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator"
import { PaginationDto } from "src/common/dto/pagination.dto"

export class FilterLuggageDto extends PaginationDto{
    @IsOptional()
    @IsString()
    name?: string

    @IsOptional()
    @IsUUID()
    tripId?: string

    @IsOptional()
    @IsUUID()
    @IsNotEmpty()
    userId?: string;
}