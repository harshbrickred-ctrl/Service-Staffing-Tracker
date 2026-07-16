import type { Rag } from '@sst/shared-types';
import { Badge } from './ui/badge';

const labels: Record<Rag, string> = {
  GREEN: 'Healthy',
  AMBER: 'Warning',
  RED: 'Escalation',
  NONE: 'N/A',
};

const variants: Record<Rag, 'success' | 'warning' | 'destructive' | 'muted'> = {
  GREEN: 'success',
  AMBER: 'warning',
  RED: 'destructive',
  NONE: 'muted',
};

export function RagChip({ rag }: { rag: Rag }) {
  return <Badge variant={variants[rag]}>{labels[rag]}</Badge>;
}
