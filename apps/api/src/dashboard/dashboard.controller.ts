import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiProtectedErrors } from '../common/swagger/api-decorators';
import { DashboardQueryDto } from '../common/swagger/query.dto';
import {
  DashboardBreakdownsDto,
  DashboardEscalationsDto,
  DashboardSummaryDto,
} from './dto/dashboard.dto';

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
    return this.dashboard.summary(query);
  }

  @Get('breakdowns')
  @ApiOperation({
    operationId: 'getDashboardBreakdowns',
    summary: 'Stage and RAG breakdown tables',
  })
  @ApiOkResponse({ type: DashboardBreakdownsDto })
  @ApiProtectedErrors()
  breakdowns(@Query() query: DashboardQueryDto) {
    return this.dashboard.breakdowns(query);
  }

  @Get('escalations')
  @ApiOperation({
    operationId: 'getDashboardEscalations',
    summary: 'At-risk, overdue, cancelled, wasted items',
  })
  @ApiOkResponse({ type: DashboardEscalationsDto })
  @ApiProtectedErrors()
  escalations(@Query() query: DashboardQueryDto) {
    return this.dashboard.escalations(query);
  }
}
