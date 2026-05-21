import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';

export class AttributeValueItemDto {
  @ApiProperty()
  @IsUUID()
  attributeDefinitionId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class SetAttributeValuesDto {
  @ApiProperty({ type: [AttributeValueItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeValueItemDto)
  values: AttributeValueItemDto[];
}
