import type { Rag } from '@sst/shared-types';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, '');
}

/** Days between start date and today (UTC date). */
export function daysSince(date: Date | string, now = new Date()): number {
  const start = new Date(date);
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((b - a) / 86_400_000);
}

/**
 * TA handoff SLA RAG:
 * Green ≤2 days late vs target, Amber 3–5, Red >5 (relative to handoff date age if no closure).
 * Uses age from requirement/handoff date against target closure when present.
 */
export function computeTaHandoffSlaRag(opts: {
  taHandoffDate: Date | string | null | undefined;
  targetClosureDate: Date | string | null | undefined;
  status: string;
  now?: Date;
}): Rag {
  if (opts.status === 'CLOSED' || opts.status === 'CANCELLED') return 'NONE';
  if (!opts.taHandoffDate) return 'AMBER';

  const now = opts.now ?? new Date();
  const handoff = new Date(opts.taHandoffDate);
  const target = opts.targetClosureDate
    ? new Date(opts.targetClosureDate)
    : null;

  if (!target) {
    const age = daysSince(handoff, now);
    if (age <= 2) return 'GREEN';
    if (age <= 5) return 'AMBER';
    return 'RED';
  }

  const overdue = daysSince(target, now);
  if (overdue <= 0) return 'GREEN';
  if (overdue <= 2) return 'AMBER';
  return 'RED';
}

export function formatPublicId(prefix: string, value: number): string {
  return `${prefix}-${String(value).padStart(5, '0')}`;
}
