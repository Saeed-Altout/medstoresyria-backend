import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';

const STAFF_ROLES = [Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTANT, Role.TECHNICIAN, Role.DELIVERY] as const;
type StaffRole = typeof STAFF_ROLES[number];

export class CreateStaffUserDto {
  @ApiProperty({ example: 'staff@medstore.sy' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Ahmad' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Hassan' })
  @IsString()
  lastName!: string;

  @ApiProperty({ enum: STAFF_ROLES })
  @IsEnum(STAFF_ROLES)
  role!: StaffRole;

  @ApiPropertyOptional({ example: '+963991234567' })
  @IsOptional()
  @IsString()
  phone?: string;
}
