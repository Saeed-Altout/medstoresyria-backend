import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SettingItemDto {
  @ApiProperty({ example: 'site_name_en' })
  @IsString()
  key!: string;

  @ApiProperty({ example: 'MedStore Syria' })
  @IsString()
  value!: string;
}

export class BulkUpdateSettingsDto {
  @ApiProperty({ type: [SettingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingItemDto)
  settings!: SettingItemDto[];
}
