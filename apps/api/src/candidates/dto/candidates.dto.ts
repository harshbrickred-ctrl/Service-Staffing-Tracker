import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCandidateDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  requirementId!: string;

  @ApiProperty({ example: 'Yogesh kumar' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: '8527172822' })
  @IsString()
  mobile!: string;

  @ApiProperty({ example: 'yogeshsingh1996@gmail.com' })
  @IsString()
  email!: string;

  @ApiPropertyOptional({ example: 'Referral' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ example: 'SUBMITTED_TO_SPOC' })
  @IsString()
  stageCode!: string;

  @ApiPropertyOptional({ example: 'PENDING' })
  @IsOptional()
  @IsString()
  feedbackCode?: string;

  @ApiPropertyOptional({ example: '2026-07-10' })
  @IsOptional()
  @IsDateString()
  profileSubmittedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateCandidateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stageCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  feedbackCode?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  profileSubmittedDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  clientShortlistDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  interviewRound?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string | null;
}

export class SelectCandidateDto {
  @ApiProperty()
  @IsBoolean()
  selected!: boolean;
}
