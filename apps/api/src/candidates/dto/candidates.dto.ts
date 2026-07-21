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

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: 'Application Development' })
  @IsOptional()
  @IsString()
  jobFamily?: string;

  @ApiProperty({ example: 'SUBMITTED_TO_SPOC' })
  @IsString()
  candidateStage!: string;

  @ApiPropertyOptional({ example: 'Pending' })
  @IsOptional()
  @IsString()
  candidateStatus?: string;

  @ApiPropertyOptional({ example: '2026-07-10' })
  @IsOptional()
  @IsDateString()
  profileSubmittedDate?: string;

  @ApiPropertyOptional({ example: '2026-07-15' })
  @IsOptional()
  @IsDateString()
  clientShortlistDate?: string;

  @ApiPropertyOptional({ example: 'Round 1' })
  @IsOptional()
  @IsString()
  interviewRound?: string;

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
  position?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobFamily?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  candidateStage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  candidateStatus?: string | null;

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
