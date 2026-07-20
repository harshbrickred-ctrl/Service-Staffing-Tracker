import { Injectable } from '@nestjs/common';
import {
  computeClosureStatus,
  computeTaHandoffSlaRag,
} from '@sst/shared-utils';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(query: Record<string, string | undefined>) {
    const reqWhere = {
      deletedAt: null as null,
      ...(query.taOwnerId ? { taOwnerId: query.taOwnerId } : {}),
      ...(query.salesOwnerId ? { salesOwnerId: query.salesOwnerId } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.priorityCode ? { priorityCode: query.priorityCode } : {}),
    };

    const requirements = await this.prisma.requirement.findMany({
      where: reqWhere,
      select: {
        id: true,
        numberOfPositions: true,
        taHandoffDate: true,
        salesOwnerId: true,
        taOwnerId: true,
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
      };
    }

    const [
      candidatesInPipeline,
      selectedCandidates,
      offersReleased,
      offersAccepted,
      candidatesJoined,
      duplicateMobileGroups,
    ] = await Promise.all([
      this.prisma.candidate.count({
        where: {
          deletedAt: null,
          selected: false,
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
      this.prisma.onboarding.count({
        where: {
          deletedAt: null,
          statusCode: 'JOINED',
          requirementId: { in: reqIds },
        },
      }),
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint as count FROM (
          SELECT mobile_normalized FROM candidates
          WHERE deleted_at IS NULL
          GROUP BY mobile_normalized
          HAVING COUNT(*) > 1
        ) t
      `,
    ]);

    const closedPositions = candidatesJoined;
    const openPositions = Math.max(0, totalPositions - closedPositions);
    const fillRate =
      totalPositions > 0 ? closedPositions / totalPositions : 0;

    return {
      totalRequirements: requirements.length,
      totalPositions,
      openPositions,
      closedPositions,
      pendingSalesHandoff,
      candidatesInPipeline,
      selectedCandidates,
      duplicateMobiles: Number(duplicateMobileGroups[0]?.count ?? 0),
      offersReleased,
      offersAccepted,
      candidatesJoined,
      fillRate: Math.round(fillRate * 10000) / 10000,
    };
  }

  async breakdowns(query: Record<string, string | undefined>) {
    const reqWhere = {
      deletedAt: null as null,
      ...(query.taOwnerId ? { taOwnerId: query.taOwnerId } : {}),
      ...(query.salesOwnerId ? { salesOwnerId: query.salesOwnerId } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
    };
    const requirements = await this.prisma.requirement.findMany({
      where: reqWhere,
    });
    const reqIds = requirements.map((r) => r.id);

    const stageGroups = reqIds.length
      ? await this.prisma.candidate.groupBy({
          by: ['stageCode'],
          where: { deletedAt: null, requirementId: { in: reqIds } },
          _count: { _all: true },
        })
      : [];

    const ragCounts = { GREEN: 0, AMBER: 0, RED: 0, NONE: 0 };
    const closureCounts = {
      ON_TRACK: 0,
      OVERDUE: 0,
      FILLED: 0,
      CANCELLED: 0,
      ON_HOLD: 0,
    };

    const joinedGroups = reqIds.length
      ? await this.prisma.onboarding.groupBy({
          by: ['requirementId'],
          where: {
            requirementId: { in: reqIds },
            statusCode: 'JOINED',
            deletedAt: null,
          },
          _count: { _all: true },
        })
      : [];
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

    return {
      byStage: stageGroups.map((g) => ({
        stageCode: g.stageCode,
        count: g._count._all,
      })),
      byRag: Object.entries(ragCounts).map(([rag, count]) => ({
        rag,
        count,
      })),
      byClosureStatus: Object.entries(closureCounts).map(
        ([closureStatus, count]) => ({
          closureStatus,
          count,
        }),
      ),
    };
  }

  async escalations(query: Record<string, string | undefined>) {
    const requirements = await this.prisma.requirement.findMany({
      where: {
        deletedAt: null,
        ...(query.taOwnerId ? { taOwnerId: query.taOwnerId } : {}),
        ...(query.salesOwnerId ? { salesOwnerId: query.salesOwnerId } : {}),
      },
      include: { client: true, candidates: { where: { deletedAt: null }, take: 1 } },
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

    const atRisk = [];
    const overdue = [];
    const closureOverdue = [];
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

    return {
      atRisk: atRisk.map((r) => ({
        id: r.id,
        publicId: r.publicId,
        roleSkill: r.roleSkill,
        client: r.client.name,
      })),
      overdue: overdue.map((r) => ({
        id: r.id,
        publicId: r.publicId,
        roleSkill: r.roleSkill,
        client: r.client.name,
      })),
      closureOverdue: closureOverdue.map((r) => ({
        id: r.id,
        publicId: r.publicId,
        roleSkill: r.roleSkill,
        client: r.client.name,
      })),
      cancelled: cancelled.map((r) => ({
        id: r.id,
        publicId: r.publicId,
        roleSkill: r.roleSkill,
        client: r.client.name,
      })),
      wasted: wasted.map((r) => ({
        id: r.id,
        publicId: r.publicId,
        roleSkill: r.roleSkill,
        client: r.client.name,
      })),
    };
  }
}
