import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RequirementStatus } from '@prisma/client';
import {
  computeTaHandoffSlaRag,
  daysSince,
} from '@sst/shared-utils';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { IdSequenceService } from '../id-sequence/id-sequence.service';
import {
  CreateRequirementDto,
  UpdateRequirementDto,
} from './dto/requirements.dto';

@Injectable()
export class RequirementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly ids: IdSequenceService,
  ) {}

  private async closedPositionsFor(requirementId: string) {
    return this.prisma.onboarding.count({
      where: {
        requirementId,
        statusCode: 'JOINED',
        deletedAt: null,
      },
    });
  }

  private async withDerived<T extends { id: string; numberOfPositions: number; requirementDate: Date; taHandoffDate: Date | null; targetClosureDate: Date | null; status: RequirementStatus }>(
    req: T,
  ) {
    const closedPositions = await this.closedPositionsFor(req.id);
    const openPositions = Math.max(0, req.numberOfPositions - closedPositions);
    return {
      ...req,
      requirementAgeDays: daysSince(req.requirementDate),
      taHandoffSlaRag: computeTaHandoffSlaRag({
        taHandoffDate: req.taHandoffDate,
        targetClosureDate: req.targetClosureDate,
        status: req.status,
      }),
      openPositions,
      closedPositions,
    };
  }

  async list(query: Record<string, string | undefined>) {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 20);
    const where: Prisma.RequirementWhereInput = {
      deletedAt: null,
      ...(query.status
        ? { status: query.status as RequirementStatus }
        : {}),
      ...(query.taOwnerId ? { taOwnerId: query.taOwnerId } : {}),
      ...(query.salesOwnerId ? { salesOwnerId: query.salesOwnerId } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.jobFamilyId ? { jobFamilyId: query.jobFamilyId } : {}),
      ...(query.priorityCode ? { priorityCode: query.priorityCode } : {}),
      ...(query.q
        ? {
            OR: [
              { roleSkill: { contains: query.q, mode: 'insensitive' } },
              { publicId: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.from || query.to
        ? {
            requirementDate: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.requirement.findMany({
        where,
        include: {
          client: true,
          jobFamily: true,
          salesOwner: {
            select: { id: true, fullName: true, email: true },
          },
          taOwner: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { requirementDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.requirement.count({ where }),
    ]);

    const items = await Promise.all(rows.map((r) => this.withDerived(r)));
    return { items, total, page, pageSize };
  }

  async get(id: string) {
    const row = await this.prisma.requirement.findFirst({
      where: { id, deletedAt: null },
      include: {
        client: true,
        jobFamily: true,
        salesOwner: {
          select: { id: true, fullName: true, email: true },
        },
        taOwner: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!row) throw new NotFoundException('Requirement not found');
    return this.withDerived(row);
  }

  async create(dto: CreateRequirementDto, actorId: string) {
    const publicId = await this.ids.next('requirement', 'REQ');
    const row = await this.prisma.requirement.create({
      data: {
        publicId,
        requirementDate: new Date(dto.requirementDate),
        clientId: dto.clientId,
        roleSkill: dto.roleSkill,
        jobFamilyId: dto.jobFamilyId,
        numberOfPositions: dto.numberOfPositions,
        salesOwnerId: dto.salesOwnerId,
        priorityCode: dto.priorityCode,
        taOwnerId: dto.taOwnerId,
        taHandoffDate: dto.taHandoffDate
          ? new Date(dto.taHandoffDate)
          : undefined,
        targetClosureDate: dto.targetClosureDate
          ? new Date(dto.targetClosureDate)
          : undefined,
        remarks: dto.remarks,
        experience: dto.experience,
        jobLocation: dto.jobLocation,
        minBudget: dto.minBudget,
        maxBudget: dto.maxBudget,
        durationMonths: dto.durationMonths,
      },
      include: {
        client: true,
        jobFamily: true,
        salesOwner: {
          select: { id: true, fullName: true, email: true },
        },
        taOwner: { select: { id: true, fullName: true, email: true } },
      },
    });
    await this.audit.log({
      entityType: 'Requirement',
      entityId: row.id,
      action: 'CREATE',
      actorUserId: actorId,
      after: row,
    });
    return this.withDerived(row);
  }

  async update(id: string, dto: UpdateRequirementDto, actorId: string) {
    const before = await this.prisma.requirement.findFirst({
      where: { id, deletedAt: null },
    });
    if (!before) throw new NotFoundException('Requirement not found');

    const data: Prisma.RequirementUpdateInput = {};
    if (dto.roleSkill !== undefined) data.roleSkill = dto.roleSkill;
    if (dto.clientId !== undefined)
      data.client = { connect: { id: dto.clientId } };
    if (dto.jobFamilyId !== undefined)
      data.jobFamily = { connect: { id: dto.jobFamilyId } };
    if (dto.numberOfPositions !== undefined)
      data.numberOfPositions = dto.numberOfPositions;
    if (dto.salesOwnerId !== undefined)
      data.salesOwner = { connect: { id: dto.salesOwnerId } };
    if (dto.taOwnerId !== undefined) {
      data.taOwner = dto.taOwnerId
        ? { connect: { id: dto.taOwnerId } }
        : { disconnect: true };
    }
    if (dto.priorityCode !== undefined) data.priorityCode = dto.priorityCode;
    if (dto.taHandoffDate !== undefined)
      data.taHandoffDate = dto.taHandoffDate
        ? new Date(dto.taHandoffDate)
        : null;
    if (dto.targetClosureDate !== undefined)
      data.targetClosureDate = dto.targetClosureDate
        ? new Date(dto.targetClosureDate)
        : null;
    if (dto.remarks !== undefined) data.remarks = dto.remarks;
    if (dto.experience !== undefined) data.experience = dto.experience;
    if (dto.jobLocation !== undefined) data.jobLocation = dto.jobLocation;
    if (dto.minBudget !== undefined) data.minBudget = dto.minBudget;
    if (dto.maxBudget !== undefined) data.maxBudget = dto.maxBudget;
    if (dto.durationMonths !== undefined)
      data.durationMonths = dto.durationMonths;

    const row = await this.prisma.requirement.update({
      where: { id },
      data,
      include: {
        client: true,
        jobFamily: true,
        salesOwner: {
          select: { id: true, fullName: true, email: true },
        },
        taOwner: { select: { id: true, fullName: true, email: true } },
      },
    });
    await this.audit.log({
      entityType: 'Requirement',
      entityId: id,
      action: 'UPDATE',
      actorUserId: actorId,
      before,
      after: row,
    });
    return this.withDerived(row);
  }

  async setStatus(id: string, status: RequirementStatus, actorId: string) {
    const before = await this.prisma.requirement.findFirst({
      where: { id, deletedAt: null },
    });
    if (!before) throw new NotFoundException('Requirement not found');
    const row = await this.prisma.requirement.update({
      where: { id },
      data: { status },
      include: {
        client: true,
        jobFamily: true,
        salesOwner: {
          select: { id: true, fullName: true, email: true },
        },
        taOwner: { select: { id: true, fullName: true, email: true } },
      },
    });
    await this.audit.log({
      entityType: 'Requirement',
      entityId: id,
      action: 'STATUS',
      actorUserId: actorId,
      before: { status: before.status },
      after: { status: row.status },
    });
    return this.withDerived(row);
  }
}
