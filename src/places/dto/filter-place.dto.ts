import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination.dto";

export class FilterPlaceDto extends PaginationDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUUID()
    userId?: string;

    @IsOptional()
    @IsUUID()
    tripId?: string;
}
