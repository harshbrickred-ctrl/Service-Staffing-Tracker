import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOnboardingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  candidateId!: string;  // Changed from offerId

  
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  hrOwnerId!: string;

  @ApiPropertyOptional({ example: 1200000 })
  @IsOptional()
  @IsNumber()
  ctcRate?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  docsPending?: boolean;

  @ApiProperty({ example: 'NOT_STARTED' })
  @IsString()
  bgvStatusCode!: string;

  @ApiPropertyOptional({ example: 'ACCEPTED' })
  @IsOptional()
  @IsString()
  offerStatus?: string;

  @ApiPropertyOptional({ example: 'IN_PROGRESS' })
  @IsOptional()
  @IsString()
  onboardingStatus?: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  joiningFormalities?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsDateString()
  expectedDoj?: string;

  @ApiPropertyOptional({ example: '2026-08-15' })
  @IsOptional()
  @IsDateString()
  offerAcceptedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateOnboardingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  hrOwnerId?: string;

  @ApiPropertyOptional({ example: 1500000 })
  @IsOptional()
  @IsNumber()
  ctcRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  docsPending?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bgvStatusCode?: string;

  @ApiPropertyOptional({ example: 'ACCEPTED' })
  @IsOptional()
  @IsString()
  offerStatus?: string;

  @ApiPropertyOptional({ example: 'IN_PROGRESS' })
  @IsOptional()
  @IsString()
  onboardingStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  joiningFormalities?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedDoj?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  actualDoj?: string | null;

  @ApiPropertyOptional({ example: '2026-08-15' })
  @IsOptional()
  @IsDateString()
  offerAcceptedDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string | null;
}

export class OnboardingStatusDto {
  @ApiProperty()
  @IsString()
  statusCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  actualDoj?: string;
}