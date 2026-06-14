import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ReviewFiltersDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;
}

export class AdminReviewFiltersDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ enum: ['pending', 'approved', 'all'], default: 'pending' })
  @IsOptional()
  @IsEnum(['pending', 'approved', 'all'])
  status?: 'pending' | 'approved' | 'all';
}
