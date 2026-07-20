import api from '@/shared/lib/api';
import type {
  AuditEntry,
  CreateRequirementBody,
  Requirement,
  RequirementListParams,
  RequirementListResponse,
  UpdateRequirementBody,
} from './requirements.types';

export async function listRequirements(params: RequirementListParams = {}) {
  const { data } = await api.get<RequirementListResponse>('/requirements', {
    params,
  });
  return data;
}

export async function getRequirement(id: string) {
  const { data } = await api.get<Requirement>(`/requirements/${id}`);
  return data;
}

export async function createRequirement(body: CreateRequirementBody) {
  const { data } = await api.post<Requirement>('/requirements', body);
  return data;
}

export async function updateRequirement(
  id: string,
  body: UpdateRequirementBody,
) {
  const { data } = await api.patch<Requirement>(`/requirements/${id}`, body);
  return data;
}

export async function setRequirementStatus(id: string, status: string) {
  const { data } = await api.post<Requirement>(`/requirements/${id}/status`, {
    status,
  });
  return data;
}

export async function listRequirementActivity(entityId: string) {
  const { data } = await api.get<{ items: AuditEntry[] }>('/audit-logs', {
    params: { entityType: 'Requirement', entityId, pageSize: 50 },
  });
  return data;
}
