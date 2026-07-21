import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOfferDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  candidateId!: string;

  @ApiPropertyOptional({ example: '2026-07-12' })
  @IsOptional()
  @IsDateString()
  offerInitiatedDate?: string;

  @ApiPropertyOptional({ example: '2026-07-13' })
  @IsOptional()
  @IsDateString()
  offerReleasedDate?: string;

  @ApiProperty({ example: 'RELEASED' })
  @IsString()
  statusCode!: string;

  @ApiPropertyOptional({ example: '18 LPA' })
  @IsOptional()
  @IsString()
  ctcRate?: string;

  @ApiPropertyOptional({ example: 'Referral' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsDateString()
  expectedDoj?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateOfferDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  offerInitiatedDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  offerReleasedDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ctcRate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedDoj?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string | null;
}

export class OfferStatusDto {
  @ApiProperty()
  @IsString()
  statusCode!: string;
}
