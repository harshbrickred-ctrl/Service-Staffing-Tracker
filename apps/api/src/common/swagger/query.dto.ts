import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/** Shared list/pagination query fields. Unknown keys → 400 per API contract. */
export class PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: '1-based page index' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({
    example: 25,
    description: 'Items per page (default 25, max 100)',
  })
  @IsOptional()
  @IsString()
  pageSize?: string;

  @ApiPropertyOptional({
    example: 'createdAt:desc',
    description: 'Sort as field:asc|desc',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: 'Search name / role / publicId where supported',
  })
  @IsOptional()
  @IsString()
  q?: string;
}

export class RequirementsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  taOwnerId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  salesOwnerId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  jobFamilyId?: string;

  @ApiPropertyOptional({ example: 'HIGH' })
  @IsOptional()
  @IsString()
  priorityCode?: string;

  @ApiPropertyOptional({ example: 'OPEN' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    example: '2026-07-01',
    description: 'Inclusive date filter (requirementDate)',
  })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsString()
  to?: string;
}

export class CandidatesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  requirementId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  stageCode?: string;

  @ApiPropertyOptional({
    example: 'true',
    description: 'Filter by selected flag (`true` / `false`)',
  })
  @IsOptional()
  @IsString()
  selected?: string;
}

export class OffersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  requirementId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  statusCode?: string;
}

export class OnboardingsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  requirementId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  statusCode?: string;
}

export class DashboardQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  taOwnerId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  salesOwnerId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priorityCode?: string;
}

export class AuditQueryDto {
  @ApiPropertyOptional({ example: 'Requirement' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsString()
  pageSize?: string;
}
