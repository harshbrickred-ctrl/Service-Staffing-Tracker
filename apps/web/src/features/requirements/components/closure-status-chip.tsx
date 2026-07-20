import type { ClosureStatus } from '@sst/shared-types';
import { Badge } from '@/shared/components/ui/badge';

const labels: Record<ClosureStatus, string> = {
  ON_TRACK: 'On Track',
  OVERDUE: 'Overdue',
  FILLED: 'Filled',
  CANCELLED: 'Cancelled',
  ON_HOLD: 'On Hold',
};

const variants: Record<
  ClosureStatus,
  'default' | 'success' | 'warning' | 'destructive' | 'muted'
> = {
  ON_TRACK: 'success',
  OVERDUE: 'destructive',
  FILLED: 'muted',
  CANCELLED: 'muted',
  ON_HOLD: 'warning',
};

export function ClosureStatusChip({ status }: { status: ClosureStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
