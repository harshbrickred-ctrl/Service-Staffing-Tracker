import { z } from 'zod';

export const requirementFormSchema = z
  .object({
    requirementDate: z.string().min(1, 'Requirement date is required'),
    clientId: z.string().uuid('Select a client'),
    roleSkill: z.string().trim().min(1, 'Role/Skill is required'),
    jobFamilyId: z.string().uuid('Select a job family'),
    numberOfPositions: z.coerce.number().int().min(1, 'At least 1 position'),
    salesOwnerId: z.string().uuid('Select a sales owner'),
    priorityCode: z.string().min(1, 'Priority is required'),
    taOwnerId: z.string().uuid().optional().or(z.literal('')),
    taHandoffDate: z.string().optional().or(z.literal('')),
    targetClosureDate: z.string().optional().or(z.literal('')),
    remarks: z.string().optional(),
    experience: z.string().optional(),
    jobLocation: z.string().optional(),
    minBudget: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
    maxBudget: z.union([z.coerce.number().nonnegative(), z.literal('')]).optional(),
    durationMonths: z
      .union([z.coerce.number().int().positive(), z.literal('')])
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.minBudget !== '' &&
      data.minBudget != null &&
      data.maxBudget !== '' &&
      data.maxBudget != null &&
      Number(data.minBudget) > Number(data.maxBudget)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Min budget must be ≤ max budget',
        path: ['minBudget'],
      });
    }
    if (
      data.requirementDate &&
      data.taHandoffDate &&
      data.taHandoffDate < data.requirementDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Handoff date cannot be before requirement date',
        path: ['taHandoffDate'],
      });
    }
    if (
      data.requirementDate &&
      data.targetClosureDate &&
      data.targetClosureDate < data.requirementDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Target closure cannot be before requirement date',
        path: ['targetClosureDate'],
      });
    }
  });

export type RequirementFormValues = z.infer<typeof requirementFormSchema>;

export function toRequirementBody(
  values: RequirementFormValues,
  salesOwnerId: string,
) {
  return {
    requirementDate: values.requirementDate,
    clientId: values.clientId,
    roleSkill: values.roleSkill.trim(),
    jobFamilyId: values.jobFamilyId,
    numberOfPositions: values.numberOfPositions,
    salesOwnerId,
    priorityCode: values.priorityCode,
    taOwnerId: values.taOwnerId || null,
    taHandoffDate: values.taHandoffDate || null,
    targetClosureDate: values.targetClosureDate || null,
    remarks: values.remarks?.trim() || null,
    experience: values.experience?.trim() || null,
    jobLocation: values.jobLocation?.trim() || null,
    minBudget:
      values.minBudget === '' || values.minBudget == null
        ? null
        : Number(values.minBudget),
    maxBudget:
      values.maxBudget === '' || values.maxBudget == null
        ? null
        : Number(values.maxBudget),
    durationMonths:
      values.durationMonths === '' || values.durationMonths == null
        ? null
        : Number(values.durationMonths),
  };
}

/** @deprecated use toRequirementBody with explicit salesOwnerId */
export function toCreateBody(
  values: RequirementFormValues,
  salesOwnerFallback?: string,
) {
  return toRequirementBody(values, values.salesOwnerId || salesOwnerFallback!);
}
