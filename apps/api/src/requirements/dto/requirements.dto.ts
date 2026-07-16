import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RequirementStatus } from '@prisma/client';

export class CreateRequirementDto {
  @ApiProperty({ example: '2026-07-07' })
  @IsDateString()
  requirementDate!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  clientId!: string;

  @ApiProperty({ example: 'Core Python Developer' })
  @IsString()
  @MinLength(1)
  roleSkill!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  jobFamilyId!: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  numberOfPositions!: number;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  salesOwnerId!: string;

  @ApiProperty({ example: 'HIGH' })
  @IsString()
  priorityCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  taOwnerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  taHandoffDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  targetClosureDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobLocation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minBudget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxBudget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  durationMonths?: number;
}

export class UpdateRequirementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleSkill?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  jobFamilyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  numberOfPositions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  salesOwnerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  taOwnerId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priorityCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  taHandoffDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  targetClosureDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  experience?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobLocation?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minBudget?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxBudget?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  durationMonths?: number | null;
}

export class RequirementStatusDto {
  @ApiProperty({ enum: RequirementStatus })
  @IsEnum(RequirementStatus)
  status!: RequirementStatus;
}
