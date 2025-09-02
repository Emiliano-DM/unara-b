import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterUserDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  username?: string;
}
