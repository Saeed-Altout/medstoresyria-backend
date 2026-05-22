import { PartialType } from '@nestjs/swagger';
import { CreateGovernorateDto } from './create-governorate.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateGovernorateDto extends PartialType(CreateGovernorateDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
