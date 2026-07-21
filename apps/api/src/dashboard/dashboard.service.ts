import { Injectable } from '@nestjs/common';
import {
  computeClosureStatus,
  computeTaHandoffSlaRag,
  daysBetween,
} from '@sst/shared-utils';
import { Prisma } from '../prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardQueryDto } from '../common/swagger/query.dto';

const percentage = (count: number, total: number) =>
  total > 0 ? Math.round((count / total) * 10_000) / 10_000 : 0;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(query: DashboardQueryDto) {
    const [summary, breakdowns, escalations] = await Promise.all([
      this.summary(query),
      this.breakdowns(query),
      this.escalations(query),
    ]);

    return { summary, breakdowns, escalations };
  }

  private requirementWhere(
    query: DashboardQueryDto,
  ): Prisma.RequirementWhereInput {
    return {
      deletedAt: null,
      ...(query.taOwnerId ? { taOwnerId: query.taOwnerId } : {}),
      ...(query.salesOwnerId ? { salesOwnerId: query.salesOwnerId } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.jobFamilyId ? { jobFamilyId: query.jobFamilyId } : {}),
      ...(query.priorityCode ? { priorityCode: query.priorityCode } : {}),
      ...(query.from || query.to
        ? {
            requirementDate: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };
  }

  async summary(query: DashboardQueryDto) {
    const requirements = await this.prisma.requirement.findMany({
      where: this.requirementWhere(query),
      select: {
        id: true,
        numberOfPositions: true,
        taHandoffDate: true,
        status: true,
        targetClosureDate: true,
        requirementDate: true,
      },
    });
    const reqIds = requirements.map((r) => r.id);

    const totalPositions = requirements
      .filter((r) => r.status !== 'CANCELLED')
      .reduce((s, r) => s + r.numberOfPositions, 0);
    const pendingSalesHandoff = requirements.filter(
      (r) => !r.taHandoffDate && r.status === 'ACTIVE',
    ).length;

    if (!reqIds.length) {
      return {
        totalRequirements: 0,
        totalPositions: 0,
        openPositions: 0,
        closedPositions: 0,
        pendingSalesHandoff: 0,
        candidatesInPipeline: 0,
        selectedCandidates: 0,
        duplicateMobiles: 0,
        offersReleased: 0,
        offersAccepted: 0,
        candidatesJoined: 0,
        fillRate: 0,
        averageDaysToFill: null,
        requirementsAtRisk: 0,
        cancelledRequirements: 0,
        wastedSourcing: 0,
        overdueRequirements: 0,
      };
    }

    const [
      candidatesInPipeline,
      selectedCandidates,
      offersReleased,
      offersAccepted,
      duplicateMobileGroups,
      joinedOnboardings,
      sourcedRequirementGroups,
    ] = await Promise.all([
      this.prisma.candidate.count({
        where: {
          deletedAt: null,
          requirementId: { in: reqIds },
        },
      }),
      this.prisma.candidate.count({
        where: {
          deletedAt: null,
          selected: true,
          requirementId: { in: reqIds },
        },
      }),
      this.prisma.offer.count({
        where: {
          deletedAt: null,
          statusCode: { in: ['RELEASED', 'ACCEPTED'] },
          requirementId: { in: reqIds },
        },
      }),
      this.prisma.offer.count({
        where: {
          deletedAt: null,
          statusCode: 'ACCEPTED',
          requirementId: { in: reqIds },
        },
      }),
      this.prisma.candidate.groupBy({
        by: ['mobileNormalized'],
        where: {
          deletedAt: null,
          requirementId: { in: reqIds },
        },
        _count: { _all: true },
      }),
      this.prisma.onboarding.findMany({
        where: {
          deletedAt: null,
          statusCode: 'JOINED',
          requirementId: { in: reqIds },
        },
        select: { requirementId: true, actualDoj: true },
      }),
      this.prisma.candidate.groupBy({
        by: ['requirementId'],
        where: { deletedAt: null, requirementId: { in: reqIds } },
        _count: { _all: true },
      }),
    ]);

    const candidatesJoined = joinedOnboardings.length;
    const closedPositions = candidatesJoined;
    const openPositions = Math.max(0, totalPositions - closedPositions);
    const fillRate =
      totalPositions > 0 ? closedPositions / totalPositions : 0;
    const requirementById = new Map(requirements.map((r) => [r.id, r]));
    const fillDurations = joinedOnboardings
      .map((onboarding) => {
        const requirement = requirementById.get(onboarding.requirementId);
        return requirement && onboarding.actualDoj
          ? daysBetween(requirement.requirementDate, onboarding.actualDoj)
          : -1;
      })
      .filter((days) => days >= 0);
    const averageDaysToFill = fillDurations.length
      ? Math.round(
          (fillDurations.reduce((sum, days) => sum + days, 0) /
            fillDurations.length) *
            10,
        ) / 10
      : null;
    const sourcedRequirementIds = new Set(
      sourcedRequirementGroups.map((group) => group.requirementId),
    );
    const joinedByRequirement = new Map<string, number>();
    for (const onboarding of joinedOnboardings) {
      joinedByRequirement.set(
        onboarding.requirementId,
        (joinedByRequirement.get(onboarding.requirementId) ?? 0) + 1,
      );
    }

    let requirementsAtRisk = 0;
    let overdueRequirements = 0;
    for (const requirement of requirements) {
      const rag = computeTaHandoffSlaRag({
        requirementDate: requirement.requirementDate,
        taHandoffDate: requirement.taHandoffDate,
        targetClosureDate: requirement.targetClosureDate,
        status: requirement.status,
      });
      if (rag === 'RED') requirementsAtRisk += 1;

      const closure = computeClosureStatus({
        status: requirement.status,
        openPositions: Math.max(
          0,
          requirement.numberOfPositions -
            (joinedByRequirement.get(requirement.id) ?? 0),
        ),
        targetClosureDate: requirement.targetClosureDate,
      });
      if (closure === 'OVERDUE') overdueRequirements += 1;
    }
    const cancelled = requirements.filter(
      (requirement) => requirement.status === 'CANCELLED',
    );

    return {
      totalRequirements: requirements.length,
      totalPositions,
      openPositions,
      closedPositions,
      pendingSalesHandoff,
      candidatesInPipeline,
      selectedCandidates,
      duplicateMobiles: duplicateMobileGroups.filter(
        (group) => group._count._all > 1,
      ).length,
      offersReleased,
      offersAccepted,
      candidatesJoined,
      fillRate: Math.round(fillRate * 10000) / 10000,
      averageDaysToFill,
      requirementsAtRisk,
      cancelledRequirements: cancelled.length,
      wastedSourcing: cancelled.filter(
        (requirement) =>
          requirement.taHandoffDate != null ||
          sourcedRequirementIds.has(requirement.id),
      ).length,
      overdueRequirements,
    };
  }

  async breakdowns(query: DashboardQueryDto) {
    const requirements = await this.prisma.requirement.findMany({
      where: this.requirementWhere(query),
    });
    const reqIds = requirements.map((r) => r.id);

    const [stageGroups, stageLookups, joinedGroups] = await Promise.all([
      reqIds.length
        ? this.prisma.candidate.groupBy({
            by: ['stageCode'],
            where: { deletedAt: null, requirementId: { in: reqIds } },
            _count: { _all: true },
          })
        : [],
      this.prisma.lookupValue.findMany({
        where: {
          lookupType: { code: 'CANDIDATE_STAGE' },
          isActive: true,
        },
        select: { code: true, label: true },
        orderBy: { sortOrder: 'asc' },
      }),
      reqIds.length
        ? this.prisma.onboarding.groupBy({
            by: ['requirementId'],
            where: {
              requirementId: { in: reqIds },
              statusCode: 'JOINED',
              deletedAt: null,
            },
            _count: { _all: true },
          })
        : [],
    ]);

    const ragCounts = { GREEN: 0, AMBER: 0, RED: 0, NONE: 0 };
    const closureCounts = {
      ON_TRACK: 0,
      OVERDUE: 0,
      FILLED: 0,
      CANCELLED: 0,
      ON_HOLD: 0,
    };

    const closedMap = new Map(
      joinedGroups.map((g) => [g.requirementId, g._count._all]),
    );

    for (const r of requirements) {
      const rag = computeTaHandoffSlaRag({
        requirementDate: r.requirementDate,
        taHandoffDate: r.taHandoffDate,
        targetClosureDate: r.targetClosureDate,
        status: r.status,
      });
      ragCounts[rag] += 1;

      const closed = closedMap.get(r.id) ?? 0;
      const open = Math.max(0, r.numberOfPositions - closed);
      const closure = computeClosureStatus({
        status: r.status,
        openPositions: open,
        targetClosureDate: r.targetClosureDate,
      });
      closureCounts[closure] += 1;
    }

    const stageCountMap = new Map(
      stageGroups.map((group) => [group.stageCode, group._count._all]),
    );
    const stageTotal = stageGroups.reduce(
      (total, group) => total + group._count._all,
      0,
    );
    const knownStageCodes = new Set(stageLookups.map((stage) => stage.code));
    const byStage = [
      ...stageLookups.map((stage) => {
        const count = stageCountMap.get(stage.code) ?? 0;
        return {
          stageCode: stage.code,
          label: stage.label,
          count,
          percentage: percentage(count, stageTotal),
        };
      }),
      ...stageGroups
        .filter((group) => !knownStageCodes.has(group.stageCode))
        .map((group) => ({
          stageCode: group.stageCode,
          label: group.stageCode,
          count: group._count._all,
          percentage: percentage(group._count._all, stageTotal),
        })),
    ];

    return {
      byStage,
      byRag: Object.entries(ragCounts).map(([rag, count]) => ({
        rag,
        count,
        percentage: percentage(count, requirements.length),
      })),
      byClosureStatus: Object.entries(closureCounts).map(
        ([closureStatus, count]) => ({
          closureStatus,
          count,
          percentage: percentage(count, requirements.length),
        }),
      ),
    };
  }

  async escalations(query: DashboardQueryDto) {
    const requirements = await this.prisma.requirement.findMany({
      where: this.requirementWhere(query),
      include: {
        client: true,
        candidates: {
          where: { deletedAt: null },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { requirementDate: 'asc' },
    });

    const joinedGroups = requirements.length
      ? await this.prisma.onboarding.groupBy({
          by: ['requirementId'],
          where: {
            requirementId: { in: requirements.map((r) => r.id) },
            statusCode: 'JOINED',
            deletedAt: null,
          },
          _count: { _all: true },
        })
      : [];
    const closedMap = new Map(
      joinedGroups.map((g) => [g.requirementId, g._count._all]),
    );

    const atRisk: typeof requirements = [];
    const overdue: typeof requirements = [];
    const closureOverdue: typeof requirements = [];
    for (const r of requirements) {
      const rag = computeTaHandoffSlaRag({
        requirementDate: r.requirementDate,
        taHandoffDate: r.taHandoffDate,
        targetClosureDate: r.targetClosureDate,
        status: r.status,
      });
      if (rag === 'AMBER') atRisk.push(r);
      if (rag === 'RED') overdue.push(r);

      const closed = closedMap.get(r.id) ?? 0;
      const open = Math.max(0, r.numberOfPositions - closed);
      const closure = computeClosureStatus({
        status: r.status,
        openPositions: open,
        targetClosureDate: r.targetClosureDate,
      });
      if (closure === 'OVERDUE') closureOverdue.push(r);
    }

    const cancelled = requirements.filter((r) => r.status === 'CANCELLED');
    const wasted = cancelled.filter(
      (r) => r.taHandoffDate != null || r.candidates.length > 0,
    );
    const toItem = (r: (typeof requirements)[number]) => ({
      id: r.id,
      publicId: r.publicId,
      roleSkill: r.roleSkill,
      client: r.client.name,
      requirementDate: r.requirementDate,
      targetClosureDate: r.targetClosureDate,
      openPositions: Math.max(
        0,
        r.numberOfPositions - (closedMap.get(r.id) ?? 0),
      ),
    });

    return {
      atRisk: atRisk.map(toItem),
      overdue: overdue.map(toItem),
      closureOverdue: closureOverdue.map(toItem),
      cancelled: cancelled.map(toItem),
      wasted: wasted.map(toItem),
    };
  }
}
