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
import { CreateOfferDto, UpdateOfferDto } from './dto/offers.dto';

@Injectable()
export class OffersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly ids: IdSequenceService,
  ) {}
async list(query: Record<string, string | undefined>) {
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? 20);
  const where: Prisma.OfferWhereInput = {
    deletedAt: null,
    ...(query.statusCode ? { statusCode: query.statusCode } : {}),
    ...(query.requirementId ? { requirementId: query.requirementId } : {}),
    ...(query.q
      ? {
          OR: [
            { publicId: { contains: query.q, mode: 'insensitive' } },
            {
              candidate: {
                name: { contains: query.q, mode: 'insensitive' },
              },
            },
          ],
        }
      : {}),
  };
  const [records, total] = await Promise.all([
    this.prisma.offer.findMany({
      where,
      include: {
        candidate: {
          select: {
            id: true,
            publicId: true,
            name: true,
            email: true,
            mobile: true,
            source: true,
            stageCode: true,
          },
        },
        requirement: {
          select: {
            roleSkill: true,
            client: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    this.prisma.offer.count({ where }),
  ]);

  // Map to only the fields you need
  const items = records.map((record) => ({
    candidateId: record.candidate.id,
    candidateName: record.candidate.name,
    position: record.requirement.roleSkill,
    client: record.requirement.client.name,
    email: record.candidate.email,
    mobile: record.candidate.mobile,
    source: record.candidate.source,
    stage: record.candidate.stageCode,
    offerStatus: record.statusCode,
  }));

  async listCandidates(query: Record<string, string | undefined>) {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(query.pageSize ?? 20) || 20),
    );
    const where: Prisma.CandidateWhereInput = {
      deletedAt: null,
      ...(query.requirementId ? { requirementId: query.requirementId } : {}),
      ...(query.stageCode ? { stageCode: query.stageCode } : {}),
      ...(query.selected !== undefined
        ? { selected: query.selected === 'true' }
        : {}),
      ...(query.q
        ? {
            OR: [
              { publicId: { contains: query.q, mode: 'insensitive' } },
              { name: { contains: query.q, mode: 'insensitive' } },
              { email: { contains: query.q, mode: 'insensitive' } },
              { mobile: { contains: query.q } },
              {
                requirement: {
                  roleSkill: { contains: query.q, mode: 'insensitive' },
                },
              },
              {
                requirement: {
                  client: {
                    name: { contains: query.q, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [records, total] = await Promise.all([
      this.prisma.candidate.findMany({
        where,
        select: {
          id: true,
          publicId: true,
          name: true,
          email: true,
          mobile: true,
          source: true,
          stageCode: true,
          feedbackCode: true,
          selected: true,
          requirement: {
            select: {
              id: true,
              publicId: true,
              roleSkill: true,
              client: { select: { id: true, name: true } },
            },
          },
          offer: {
            select: { id: true, publicId: true, statusCode: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.candidate.count({ where }),
    ]);

    const items = records.map((candidate) => ({
      id: candidate.id,
      candidateId: candidate.publicId,
      name: candidate.name,
      position: candidate.requirement.roleSkill,
      client: candidate.requirement.client.name,
      email: candidate.email,
      mobile: candidate.mobile,
      source: candidate.source,
      stage: candidate.stageCode,
      rag: null,
      candidateStatus:
        candidate.feedbackCode ?? (candidate.selected ? 'Selected' : 'Pending'),
      details: {
        candidateUuid: candidate.id,
        requirementId: candidate.requirement.id,
        requirementPublicId: candidate.requirement.publicId,
        clientId: candidate.requirement.client.id,
        offerId: candidate.offer?.id ?? null,
        offerPublicId: candidate.offer?.publicId ?? null,
        offerStatus: candidate.offer?.statusCode ?? null,
      },
    }));

    return { items, total, page, pageSize };
  }

  async get(id: string): Promise<any> {
  const row = await this.prisma.offer.findFirst({
    where: { id, deletedAt: null },
    include: {
      candidate: {
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          source: true,
          stageCode: true,
        },
      },
      requirement: {
        select: {
          roleSkill: true,
          client: {
            select: { name: true },
          },
        },
      },
    },
  });
  if (!row) throw new NotFoundException('Offer not found');
  
  // Return only the fields you need
  return {
    candidateId: row.candidate.id,
    candidateName: row.candidate.name,
    position: row.requirement.roleSkill,
    client: row.requirement.client.name,
    email: row.candidate.email,
    mobile: row.candidate.mobile,
    source: row.candidate.source,
    stage: row.candidate.stageCode,
    offerStatus: row.statusCode,
  };
}
  async create(dto: CreateOfferDto, actorId: string) {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: dto.candidateId, deletedAt: null },
      include: { offer: true },
    });
    if (!candidate) throw new NotFoundException('Candidate not found');
    if (!candidate.selected) {
      throw new BadRequestException('Candidate must be selected before offer');
    }
    if (candidate.offer) {
      throw new ConflictException('Offer already exists for candidate');
    }
    const publicId = await this.ids.next('offer', 'OFF');
    const row = await this.prisma.offer.create({
      data: {
        publicId,
        candidateId: candidate.id,
        requirementId: candidate.requirementId,
        offerInitiatedDate: dto.offerInitiatedDate
          ? new Date(dto.offerInitiatedDate)
          : undefined,
        offerReleasedDate: dto.offerReleasedDate
          ? new Date(dto.offerReleasedDate)
          : undefined,
        statusCode: dto.statusCode,
        ctcRate: dto.ctcRate,
        expectedDoj: dto.expectedDoj ? new Date(dto.expectedDoj) : undefined,
        remarks: dto.remarks,
      },
      include: {
        candidate: {
          select: {
            id: true,
            publicId: true,
            name: true,
            email: true,
            mobile: true,
            source: true,
            stageCode: true,
            selected: true,
          },
        },
        requirement: {
          select: { id: true, publicId: true, roleSkill: true },
        },
      },
    });
    await this.audit.log({
      entityType: 'Offer',
      entityId: row.id,
      action: 'CREATE',
      actorUserId: actorId,
      after: row,
    });
    return row;
  }

  async update(id: string, dto: UpdateOfferDto, actorId: string) {
    const before = await this.prisma.offer.findFirst({
      where: { id, deletedAt: null },
    });
    if (!before) throw new NotFoundException('Offer not found');
    const row = await this.prisma.offer.update({
      where: { id },
      data: {
        offerInitiatedDate:
          dto.offerInitiatedDate === undefined
            ? undefined
            : dto.offerInitiatedDate
              ? new Date(dto.offerInitiatedDate)
              : null,
        offerReleasedDate:
          dto.offerReleasedDate === undefined
            ? undefined
            : dto.offerReleasedDate
              ? new Date(dto.offerReleasedDate)
              : null,
        ctcRate: dto.ctcRate,
        expectedDoj:
          dto.expectedDoj === undefined
            ? undefined
            : dto.expectedDoj
              ? new Date(dto.expectedDoj)
              : null,
        remarks: dto.remarks,
      },
      include: {
        candidate: {
          select: {
            id: true,
            publicId: true,
            name: true,
            email: true,
            mobile: true,
            source: true,
            stageCode: true,
            selected: true,
          },
        },
        requirement: {
          select: { id: true, publicId: true, roleSkill: true },
        },
      },
    });
    await this.audit.log({
      entityType: 'Offer',
      entityId: id,
      action: 'UPDATE',
      actorUserId: actorId,
      before,
      after: row,
    });
    return row;
  }

  async setStatus(id: string, statusCode: string, actorId: string) {
    const before = await this.prisma.offer.findFirst({
      where: { id, deletedAt: null },
    });
    if (!before) throw new NotFoundException('Offer not found');
    const row = await this.prisma.offer.update({
      where: { id },
      data: { statusCode },
      include: {
        candidate: {
          select: {
            id: true,
            publicId: true,
            name: true,
            email: true,
            mobile: true,
            source: true,
            stageCode: true,
            selected: true,
          },
        },
        requirement: {
          select: { id: true, publicId: true, roleSkill: true },
        },
      },
    });
    await this.audit.log({
      entityType: 'Offer',
      entityId: id,
      action: 'STATUS',
      actorUserId: actorId,
      before: { statusCode: before.statusCode },
      after: { statusCode: row.statusCode },
    });
    return row;
  }
}
