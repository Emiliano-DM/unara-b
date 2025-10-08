import { Type } from "class-transformer";
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator"
import { PaginationDto } from "src/common/dto/pagination.dto";
import { IsAfter } from "src/common/validators/is-after.validator";

export class FilterTripDto extends PaginationDto{
    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    destination?: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    startDate?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    @IsAfter('startDate')
    endDate?: Date;

    @IsOptional()
    @IsUUID()
    @IsNotEmpty()
    userId: string;
}