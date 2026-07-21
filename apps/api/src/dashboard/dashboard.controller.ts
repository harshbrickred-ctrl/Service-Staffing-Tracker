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
import { DashboardDto } from './dto/dashboard.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @ApiOperation({
    operationId: 'getDashboard',
    summary: 'Complete dashboard data',
  })
  @ApiOkResponse({ type: DashboardDto })
  @ApiProtectedErrors()
  getDashboard(@Query() query: DashboardQueryDto) {
    return this.dashboard.getDashboard(query);
  }
}
