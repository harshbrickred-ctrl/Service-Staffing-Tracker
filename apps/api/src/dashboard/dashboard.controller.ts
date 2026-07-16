import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiProtectedErrors } from '../common/swagger/api-decorators';
import { DashboardQueryDto } from '../common/swagger/query.dto';

class DashboardSummaryDto {
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

  @ApiProperty({ example: 0 })
  duplicateMobiles!: number;

  @ApiProperty({ example: 0 })
  offersReleased!: number;

  @ApiProperty({ example: 0 })
  offersAccepted!: number;

  @ApiProperty({ example: 0 })
  candidatesJoined!: number;

  @ApiProperty({ example: 0.0588 })
  fillRate!: number;
}

@ApiTags('Dashboard')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    operationId: 'getDashboardSummary',
    summary: 'KPI summary cards',
  })
  @ApiOkResponse({ type: DashboardSummaryDto })
  @ApiProtectedErrors()
  summary(@Query() query: DashboardQueryDto) {
    return this.dashboard.summary(query as Record<string, string>);
  }

  @Get('breakdowns')
  @ApiOperation({
    operationId: 'getDashboardBreakdowns',
    summary: 'Stage and RAG breakdown tables',
  })
  @ApiOkResponse({ description: 'Breakdown datasets' })
  @ApiProtectedErrors()
  breakdowns(@Query() query: DashboardQueryDto) {
    return this.dashboard.breakdowns(query as Record<string, string>);
  }

  @Get('escalations')
  @ApiOperation({
    operationId: 'getDashboardEscalations',
    summary: 'At-risk, overdue, cancelled, wasted items',
  })
  @ApiOkResponse({ description: 'Escalation lists' })
  @ApiProtectedErrors()
  escalations(@Query() query: DashboardQueryDto) {
    return this.dashboard.escalations(query as Record<string, string>);
  }
}
