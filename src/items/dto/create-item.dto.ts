import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateItemDto {
    @ApiProperty({
        description: 'Item name',
        example: 'Travel Backpack',
        maxLength: 255
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @ApiProperty({
        description: 'Item description (optional)',
        example: 'A durable backpack perfect for travel',
        required: false
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: 'Item image URL (optional)',
        example: 'https://example.com/backpack.jpg',
        required: false
    })
    @IsOptional()
    @IsString()
    image?: string

    @ApiProperty({
        description: 'Category UUID',
        format: 'uuid',
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    })
    @IsUUID()
    @IsNotEmpty()
    categoryId: string
}
