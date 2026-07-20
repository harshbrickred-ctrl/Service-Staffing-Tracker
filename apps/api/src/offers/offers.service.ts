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
    const [items, total] = await Promise.all([
      this.prisma.offer.findMany({
        where,
        include: {
          candidate: { select: { id: true, publicId: true, name: true } },
          requirement: {
            select: { id: true, publicId: true, roleSkill: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.offer.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async get(id: string) {
    const row = await this.prisma.offer.findFirst({
      where: { id, deletedAt: null },
      include: {
        candidate: true,
        requirement: { include: { client: true } },
        onboarding: true,
      },
    });
    if (!row) throw new NotFoundException('Offer not found');
    return row;
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
        candidate: { select: { id: true, publicId: true, name: true } },
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
        candidate: { select: { id: true, publicId: true, name: true } },
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
        candidate: { select: { id: true, publicId: true, name: true } },
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
