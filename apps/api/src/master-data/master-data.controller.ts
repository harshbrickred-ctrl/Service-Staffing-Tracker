import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { MasterDataService } from './master-data.service';
import {
  CreateClientDto,
  CreateJobFamilyDto,
  CreateLookupValueDto,
  UpdateClientDto,
  UpdateJobFamilyDto,
  UpdateLookupValueDto,
} from './dto/master-data.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import {
  ApiMutateErrors,
  ApiProtectedErrors,
} from '../common/swagger/api-decorators';

@ApiTags('Master data')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('master-data')
export class MasterDataController {
  constructor(private readonly master: MasterDataService) {}

  @Get('lookups/:type')
  @ApiOperation({
    operationId: 'listLookups',
    summary: 'List lookup values by type',
  })
  @ApiParam({
    name: 'type',
    description:
      'PRIORITY | CANDIDATE_STAGE | FEEDBACK | OFFER_STATUS | ONBOARDING_STATUS | BGV_STATUS | REQUIREMENT_STATUS',
    example: 'PRIORITY',
  })
  @ApiOkResponse({ description: 'Lookup values' })
  @ApiProtectedErrors()
  listLookups(@Param('type') type: string) {
    return this.master.listLookups(type);
  }

  @Roles(Role.ADMIN)
  @Post('lookups/:type')
  @ApiOperation({
    operationId: 'createLookup',
    summary: 'Create lookup value (Admin)',
  })
  @ApiParam({ name: 'type', example: 'PRIORITY' })
  @ApiCreatedResponse({ description: 'Created lookup' })
  @ApiMutateErrors()
  createLookup(
    @Param('type') type: string,
    @Body() dto: CreateLookupValueDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.master.createLookup(type, dto, user.id);
  }

  @Roles(Role.ADMIN)
  @Patch('lookups/:type/:id')
  @ApiOperation({
    operationId: 'updateLookup',
    summary: 'Update lookup value (Admin)',
  })
  @ApiParam({ name: 'type', example: 'PRIORITY' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Updated lookup' })
  @ApiMutateErrors()
  updateLookup(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() dto: UpdateLookupValueDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.master.updateLookup(type, id, dto, user.id);
  }

  @Get('clients')
  @ApiOperation({ operationId: 'listClients', summary: 'List clients' })
  @ApiOkResponse({ description: 'Clients' })
  @ApiProtectedErrors()
  listClients() {
    return this.master.listClients();
  }

  @Roles(Role.ADMIN, Role.SALES)
  @Post('clients')
  @ApiOperation({
    operationId: 'createClient',
    summary: 'Create client (Admin/Sales)',
  })
  @ApiCreatedResponse({ description: 'Created client' })
  @ApiMutateErrors()
  createClient(@Body() dto: CreateClientDto, @CurrentUser() user: AuthUser) {
    return this.master.createClient(dto, user.id);
  }

  @Roles(Role.ADMIN, Role.SALES)
  @Patch('clients/:id')
  @ApiOperation({
    operationId: 'updateClient',
    summary: 'Update client (Admin/Sales)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Updated client' })
  @ApiMutateErrors()
  updateClient(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.master.updateClient(id, dto, user.id);
  }

  @Get('job-families')
  @ApiOperation({
    operationId: 'listJobFamilies',
    summary: 'List job families',
  })
  @ApiOkResponse({ description: 'Job families' })
  @ApiProtectedErrors()
  listJobFamilies() {
    return this.master.listJobFamilies();
  }

  @Roles(Role.ADMIN)
  @Post('job-families')
  @ApiOperation({
    operationId: 'createJobFamily',
    summary: 'Create job family (Admin)',
  })
  @ApiCreatedResponse({ description: 'Created job family' })
  @ApiMutateErrors()
  createJobFamily(
    @Body() dto: CreateJobFamilyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.master.createJobFamily(dto, user.id);
  }

  @Roles(Role.ADMIN)
  @Patch('job-families/:id')
  @ApiOperation({
    operationId: 'updateJobFamily',
    summary: 'Update job family (Admin)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Updated job family' })
  @ApiMutateErrors()
  updateJobFamily(
    @Param('id') id: string,
    @Body() dto: UpdateJobFamilyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.master.updateJobFamily(id, dto, user.id);
  }
}
