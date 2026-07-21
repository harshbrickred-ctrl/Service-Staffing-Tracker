import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { IdSequenceService } from '../id-sequence/id-sequence.service';
import { RequirementsService } from '../requirements/requirements.service';
import {
  CreateOnboardingDto,
  UpdateOnboardingDto,
} from './dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly ids: IdSequenceService,
    private readonly requirements: RequirementsService,
  ) {}

  private mapOnboardingRow(row: any): any {
    const offerInitiatedDate = row.offer?.offerInitiatedDate ?? null;
    const offerReleasedDate = row.offer?.offerReleasedDate ?? null;
    const offerStatus = row.offer?.statusCode ?? null;
    const ctcRate = row.offer?.ctcRate ?? null;
    const offerAcceptedDate = row.offerAcceptedDate ?? null;
    const onboardingTATDays =
      offerReleasedDate && offerAcceptedDate
        ? Math.max(
            0,
            Math.round(
              (offerAcceptedDate.getTime() - offerReleasedDate.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          )
        : null;

    return {
      ...row,
      onboardingId: row.publicId,
      candidateId: row.candidate?.id,
      candidateCode: row.candidate?.publicId,
      reqId: row.requirement?.publicId,
      candidateName: row.candidate?.name,
      mobileNumber: row.candidate?.mobile,
      emailAddress: row.candidate?.email,
      clientRole: row.requirement?.roleSkill,
      offerInitiatedDate,
      offerReleasedDate,
      offerStatus,
      ctcRate,
      hrOwnerName: row.hrOwner?.fullName ?? null,
      offerAcceptedDate,
      expectedDOJ: row.expectedDoj,
      pendingDocs: row.docsPending,
      bgvStatus: row.bgvStatusCode,
      joiningFormalities: row.joiningFormalities,
      actualDOJ: row.actualDoj,
      onboardingStatus: row.statusCode,
      onboardingTATDays,
      remarks: row.remarks,
    };
  }

  async list(query: Record<string, string | undefined>): Promise<any> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 20);
    const where: Prisma.OnboardingWhereInput = {
      deletedAt: null,
      ...(query.statusCode ? { statusCode: query.statusCode } : {}),
      ...(query.requirementId ? { requirementId: query.requirementId } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.onboarding.findMany({
        where,
        include: {
          candidate: { select: { id: true, publicId: true, name: true, mobile: true, email: true } },
          offer: {
            select: {
              id: true,
              publicId: true,
              statusCode: true,
              offerInitiatedDate: true,
              offerReleasedDate: true,
              ctcRate: true,
            },
          },
          hrOwner: { select: { id: true, fullName: true, email: true } },
          requirement: {
            select: { id: true, publicId: true, roleSkill: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.onboarding.count({ where }),
    ]);
    return { items: items.map((row) => this.mapOnboardingRow(row)), total, page, pageSize };
  }

  async get(id: string): Promise<any> {
    const row = await this.prisma.onboarding.findFirst({
      where: { id, deletedAt: null },
      include: {
        candidate: true,
        offer: true,
        hrOwner: { select: { id: true, fullName: true, email: true } },
        requirement: { include: { client: true } },
      },
    });
    if (!row) throw new NotFoundException('Onboarding not found');
    return this.mapOnboardingRow(row);
  }

  async create(dto: CreateOnboardingDto, actorId: string): Promise<any> {
    const offer = await this.prisma.offer.findFirst({
      where: { id: dto.offerId, deletedAt: null },
      include: { onboarding: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');
    if (offer.statusCode !== 'ACCEPTED') {
      throw new BadRequestException(
        'Onboarding requires an accepted offer',
      );
    }
    if (offer.onboarding) {
      throw new ConflictException('Onboarding already exists for offer');
    }

    const req = await this.prisma.requirement.findFirst({
      where: { id: offer.requirementId, deletedAt: null },
    });
    if (!req) throw new NotFoundException('Requirement not found');
    if (req.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cannot start onboarding for a Cancelled requirement',
      );
    }

    const joined = await this.prisma.onboarding.count({
      where: {
        requirementId: offer.requirementId,
        statusCode: 'JOINED',
        deletedAt: null,
      },
    });
    if (joined >= req.numberOfPositions) {
      throw new BadRequestException(
        'All positions for this requirement are already filled',
      );
    }

    const publicId = await this.ids.next('onboarding', 'ONB');
    const row = await this.prisma.onboarding.create({
      data: {
        publicId,
        offerId: offer.id,
        candidateId: offer.candidateId,
        requirementId: offer.requirementId,
        hrOwnerId: dto.hrOwnerId,
        docsPending: dto.docsPending ?? true,
        bgvStatusCode: dto.bgvStatusCode,
        joiningFormalities: dto.joiningFormalities,
        expectedDoj: dto.expectedDoj
          ? new Date(dto.expectedDoj)
          : offer.expectedDoj,
        offerAcceptedDate: dto.offerAcceptedDate
          ? new Date(dto.offerAcceptedDate)
          : undefined,
        statusCode: dto.statusCode ?? 'IN_PROGRESS',
        remarks: dto.remarks,
      },
      include: {
        candidate: { select: { id: true, publicId: true, name: true, mobile: true, email: true } },
        offer: {
          select: {
            id: true,
            publicId: true,
            statusCode: true,
            offerInitiatedDate: true,
            offerReleasedDate: true,
            ctcRate: true,
          },
        },
        hrOwner: { select: { id: true, fullName: true, email: true } },
        requirement: { select: { id: true, publicId: true, roleSkill: true } },
      },
    });
    await this.audit.log({
      entityType: 'Onboarding',
      entityId: row.id,
      action: 'CREATE',
      actorUserId: actorId,
      after: row,
    });
    return this.mapOnboardingRow(row);
  }

  async update(id: string, dto: UpdateOnboardingDto, actorId: string): Promise<any> {
    const before = await this.prisma.onboarding.findFirst({
      where: { id, deletedAt: null },
    });
    if (!before) throw new NotFoundException('Onboarding not found');
    const row = await this.prisma.onboarding.update({
      where: { id },
      data: {
        hrOwnerId: dto.hrOwnerId,
        docsPending: dto.docsPending,
        bgvStatusCode: dto.bgvStatusCode,
        joiningFormalities: dto.joiningFormalities,
        expectedDoj:
          dto.expectedDoj === undefined
            ? undefined
            : dto.expectedDoj
              ? new Date(dto.expectedDoj)
              : null,
        offerAcceptedDate:
          dto.offerAcceptedDate === undefined
            ? undefined
            : dto.offerAcceptedDate
              ? new Date(dto.offerAcceptedDate)
              : null,
        actualDoj:
          dto.actualDoj === undefined
            ? undefined
            : dto.actualDoj
              ? new Date(dto.actualDoj)
              : null,
        remarks: dto.remarks,
      },
      include: {
        candidate: { select: { id: true, publicId: true, name: true, mobile: true, email: true } },
        offer: {
          select: {
            id: true,
            publicId: true,
            statusCode: true,
            offerInitiatedDate: true,
            offerReleasedDate: true,
            ctcRate: true,
          },
        },
        hrOwner: { select: { id: true, fullName: true, email: true } },
        requirement: { select: { id: true, publicId: true, roleSkill: true } },
      },
    });
    await this.audit.log({
      entityType: 'Onboarding',
      entityId: id,
      action: 'UPDATE',
      actorUserId: actorId,
      before,
      after: row,
    });
    return this.mapOnboardingRow(row);
  }

  async setStatus(
    id: string,
    statusCode: string,
    actorId: string,
    actualDoj?: string,
  ): Promise<any> {
    const before = await this.prisma.onboarding.findFirst({
      where: { id, deletedAt: null },
    });
    if (!before) throw new NotFoundException('Onboarding not found');

    if (statusCode === 'JOINED' && before.statusCode !== 'JOINED') {
      const req = await this.prisma.requirement.findUnique({
        where: { id: before.requirementId },
      });
      if (req) {
        const joined = await this.prisma.onboarding.count({
          where: {
            requirementId: req.id,
            statusCode: 'JOINED',
            deletedAt: null,
          },
        });
        if (joined >= req.numberOfPositions) {
          throw new BadRequestException(
            'All positions for this requirement are already filled',
          );
        }
      }
    }

    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.onboarding.update({
        where: { id },
        data: {
          statusCode,
          actualDoj:
            statusCode === 'JOINED'
              ? actualDoj
                ? new Date(actualDoj)
                : before.actualDoj ?? new Date()
              : before.actualDoj,
          docsPending: statusCode === 'JOINED' ? false : before.docsPending,
        },
        include: {
          candidate: { select: { id: true, publicId: true, name: true, mobile: true, email: true } },
          offer: {
            select: {
              id: true,
              publicId: true,
              statusCode: true,
              offerInitiatedDate: true,
              offerReleasedDate: true,
              ctcRate: true,
            },
          },
          hrOwner: { select: { id: true, fullName: true, email: true } },
          requirement: { select: { id: true, publicId: true, roleSkill: true } },
        },
      });

      await this.audit.log(
        {
          entityType: 'Onboarding',
          entityId: id,
          action: 'STATUS',
          actorUserId: actorId,
          before: { statusCode: before.statusCode },
          after: { statusCode: updated.statusCode },
        },
        tx,
      );

      if (
        statusCode === 'JOINED' ||
        before.statusCode === 'JOINED'
      ) {
        await this.requirements.syncFillStatus(
          before.requirementId,
          actorId,
          tx,
        );
      }

      return updated;
    });

    return this.mapOnboardingRow(row);
  }
}
