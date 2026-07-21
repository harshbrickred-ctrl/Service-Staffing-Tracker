import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardSummaryDto {
  @ApiProperty({ example: 8 })
  totalRequirements!: number;

  @ApiProperty({ example: 17 })
  totalPositions!: number;

  @ApiProperty({ example: 16 })
  openPositions!: number;

  @ApiProperty({ example: 1 })
  closedPositions!: number;

  @ApiProperty({ example: 0 })
  pendingSalesHandoff!: number;

  @ApiProperty({ example: 5 })
  candidatesInPipeline!: number;

  @ApiProperty({ example: 1 })
  selectedCandidates!: number;

  @ApiProperty({
    example: 0,
    description: 'Duplicate mobile-number groups in the filtered requirements',
  })
  duplicateMobiles!: number;

  @ApiProperty({
    example: 1,
    description: 'Offers currently released or subsequently accepted',
  })
  offersReleased!: number;

  @ApiProperty({ example: 1 })
  offersAccepted!: number;

  @ApiProperty({ example: 1 })
  candidatesJoined!: number;

  @ApiProperty({
    example: 0.0588,
    description: 'Closed positions divided by non-cancelled positions (0..1)',
  })
  fillRate!: number;

  @ApiPropertyOptional({
    example: 15.5,
    nullable: true,
    description:
      'Average calendar days from requirement date to actual joining date',
  })
  averageDaysToFill!: number | null;

  @ApiProperty({ example: 0, description: 'Requirements with RED handoff SLA' })
  requirementsAtRisk!: number;

  @ApiProperty({ example: 0 })
  cancelledRequirements!: number;

  @ApiProperty({
    example: 0,
    description:
      'Cancelled requirements where TA handoff or candidate sourcing started',
  })
  wastedSourcing!: number;

  @ApiProperty({
    example: 4,
    description: 'Requirements past target closure date with open positions',
  })
  overdueRequirements!: number;
}

export class DashboardStageBreakdownDto {
  @ApiProperty({ example: 'SUBMITTED_TO_SPOC' })
  stageCode!: string;

  @ApiProperty({ example: 'Submitted to SPOC' })
  label!: string;

  @ApiProperty({ example: 2 })
  count!: number;

  @ApiProperty({ example: 0.2857, description: 'Share of candidates (0..1)' })
  percentage!: number;
}

export class DashboardRagBreakdownDto {
  @ApiProperty({ enum: ['GREEN', 'AMBER', 'RED', 'NONE'] })
  rag!: string;

  @ApiProperty({ example: 8 })
  count!: number;

  @ApiProperty({ example: 1, description: 'Share of requirements (0..1)' })
  percentage!: number;
}

export class DashboardClosureBreakdownDto {
  @ApiProperty({
    enum: ['ON_TRACK', 'OVERDUE', 'FILLED', 'CANCELLED', 'ON_HOLD'],
  })
  closureStatus!: string;

  @ApiProperty({ example: 4 })
  count!: number;

  @ApiProperty({ example: 0.5, description: 'Share of requirements (0..1)' })
  percentage!: number;
}

export class DashboardBreakdownsDto {
  @ApiProperty({ type: [DashboardStageBreakdownDto] })
  byStage!: DashboardStageBreakdownDto[];

  @ApiProperty({ type: [DashboardRagBreakdownDto] })
  byRag!: DashboardRagBreakdownDto[];

  @ApiProperty({ type: [DashboardClosureBreakdownDto] })
  byClosureStatus!: DashboardClosureBreakdownDto[];
}

export class DashboardEscalationItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'REQ-00008' })
  publicId!: string;

  @ApiProperty({ example: 'Senior Java Developer' })
  roleSkill!: string;

  @ApiProperty({ example: 'Acme Corp' })
  client!: string;

  @ApiProperty({ example: '2026-07-01', type: String, format: 'date' })
  requirementDate!: Date;

  @ApiPropertyOptional({
    example: '2026-07-20',
    type: String,
    format: 'date',
    nullable: true,
  })
  targetClosureDate!: Date | null;

  @ApiProperty({ example: 2 })
  openPositions!: number;
}

export class DashboardEscalationsDto {
  @ApiProperty({
    type: [DashboardEscalationItemDto],
    description: 'AMBER handoff SLA requirements',
  })
  atRisk!: DashboardEscalationItemDto[];

  @ApiProperty({
    type: [DashboardEscalationItemDto],
    description: 'RED handoff SLA requirements',
  })
  overdue!: DashboardEscalationItemDto[];

  @ApiProperty({
    type: [DashboardEscalationItemDto],
    description: 'Requirements past target date with open positions',
  })
  closureOverdue!: DashboardEscalationItemDto[];

  @ApiProperty({ type: [DashboardEscalationItemDto] })
  cancelled!: DashboardEscalationItemDto[];

  @ApiProperty({
    type: [DashboardEscalationItemDto],
    description:
      'Cancelled requirements where TA handoff or candidate sourcing started',
  })
  wasted!: DashboardEscalationItemDto[];
}
