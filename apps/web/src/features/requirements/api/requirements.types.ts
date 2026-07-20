import type { ClosureStatus, Rag, RequirementStatus } from '@sst/shared-types';

export type DirectoryUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

export type RequirementOwner = {
  id: string;
  fullName: string;
  email: string;
  role?: string;
};

export type Requirement = {
  id: string;
  publicId: string;
  requirementDate: string;
  clientId: string;
  client?: { id: string; name: string };
  roleSkill: string;
  jobFamilyId: string;
  jobFamily?: { id: string; name: string };
  numberOfPositions: number;
  salesOwnerId: string;
  salesOwner?: RequirementOwner;
  priorityCode: string;
  taOwnerId?: string | null;
  taOwner?: RequirementOwner | null;
  taHandoffDate?: string | null;
  targetClosureDate?: string | null;
  remarks?: string | null;
  experience?: string | null;
  jobLocation?: string | null;
  minBudget?: number | string | null;
  maxBudget?: number | string | null;
  durationMonths?: number | null;
  status: RequirementStatus;
  requirementAgeDays: number;
  taHandoffSlaRag: Rag;
  openPositions: number;
  closedPositions: number;
  closureStatus: ClosureStatus;
  taReadyReqId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type RequirementListResponse = {
  items: Requirement[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
};

export type RequirementListParams = {
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  status?: string;
  clientId?: string;
  jobFamilyId?: string;
  priorityCode?: string;
  salesOwnerId?: string;
  taOwnerId?: string;
  from?: string;
  to?: string;
};

export type CreateRequirementBody = {
  requirementDate: string;
  clientId: string;
  roleSkill: string;
  jobFamilyId: string;
  numberOfPositions: number;
  salesOwnerId: string;
  priorityCode: string;
  taOwnerId?: string | null;
  taHandoffDate?: string | null;
  targetClosureDate?: string | null;
  remarks?: string | null;
  experience?: string | null;
  jobLocation?: string | null;
  minBudget?: number | null;
  maxBudget?: number | null;
  durationMonths?: number | null;
};

export type UpdateRequirementBody = Partial<CreateRequirementBody>;

export type AuditEntry = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  createdAt: string;
  actor?: { id: string; fullName: string; email: string } | null;
  beforeJson?: unknown;
  afterJson?: unknown;
};
