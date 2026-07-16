import { z } from 'zod';

export const RoleSchema = z.enum([
  'ADMIN',
  'SALES',
  'TA',
  'HR',
  'LEADERSHIP_READONLY',
]);
export type Role = z.infer<typeof RoleSchema>;

export const RequirementStatusSchema = z.enum([
  'ACTIVE',
  'ON_HOLD',
  'CANCELLED',
  'CLOSED',
]);
export type RequirementStatus = z.infer<typeof RequirementStatusSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const UserPublicSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  role: RoleSchema,
  isActive: z.boolean().optional(),
});
export type UserPublic = z.infer<typeof UserPublicSchema>;

export const RagSchema = z.enum(['GREEN', 'AMBER', 'RED', 'NONE']);
export type Rag = z.infer<typeof RagSchema>;

export const LOOKUP_TYPES = [
  'PRIORITY',
  'CANDIDATE_STAGE',
  'FEEDBACK',
  'OFFER_STATUS',
  'ONBOARDING_STATUS',
  'BGV_STATUS',
  'REQUIREMENT_STATUS',
] as const;
export type LookupType = (typeof LOOKUP_TYPES)[number];

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
