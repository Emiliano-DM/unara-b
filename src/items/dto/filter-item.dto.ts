import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterItemDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
