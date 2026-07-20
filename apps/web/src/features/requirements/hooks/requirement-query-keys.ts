import type { RequirementListParams } from '../api/requirements.types';

export const requirementKeys = {
  all: ['requirements'] as const,
  lists: () => [...requirementKeys.all, 'list'] as const,
  list: (params: RequirementListParams) =>
    [...requirementKeys.lists(), params] as const,
  details: () => [...requirementKeys.all, 'detail'] as const,
  detail: (id: string) => [...requirementKeys.details(), id] as const,
  masters: () => ['requirements-masters'] as const,
  activity: (id: string) => [...requirementKeys.detail(id), 'activity'] as const,
};

export const dashboardKeys = {
  all: ['dashboard'] as const,
};
