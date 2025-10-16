import { Type } from 'class-transformer';
import { IsString, IsEnum, IsBoolean, IsOptional, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';

class CreateSurveyOptionDto {
    @IsString()
    text: string;

    @IsOptional()
    latitude?: number;

    @IsOptional()
    longitude?: number;

    @IsOptional()
    @IsString()
    placeId?: string;

    @IsOptional()
    datetime?: Date;
}

export class CreateSurveyDto {
    @IsString()
    question: string;

    @IsEnum(['Destino', 'Fechas', 'General'])
    category: string;

    @IsEnum(['text', 'location', 'datetime'])
    data_type: string;

    @IsBoolean()
    @IsOptional()
    multiple_choice?: boolean;

    @IsArray()
    @ArrayMinSize(2)
    @ValidateNested({ each: true })
    @Type(() => CreateSurveyOptionDto)
    options: CreateSurveyOptionDto[];
}