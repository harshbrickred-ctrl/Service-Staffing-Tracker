import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '@/shared/lib/api';
import { PageFade } from '@/shared/components/page-fade';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { RagChip } from '@/shared/components/rag-chip';
import type { Rag } from '@sst/shared-types';

type Summary = {
  totalRequirements: number;
  totalPositions: number;
  openPositions: number;
  closedPositions: number;
  pendingSalesHandoff: number;
  candidatesInPipeline: number;
  selectedCandidates: number;
  duplicateMobiles: number;
  offersReleased: number;
  offersAccepted: number;
  candidatesJoined: number;
  fillRate: number;
};

type DashboardResponse = {
  summary: Summary;
  breakdowns: {
    byStage: Array<{ stageCode: string; count: number }>;
    byRag: Array<{ rag: Rag; count: number }>;
  };
  escalations: Record<
    'overdue' | 'atRisk' | 'cancelled',
    Array<{ id: string; publicId: string; roleSkill: string }>
  >;
};

export function DashboardPage() {
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard')).data as DashboardResponse,
  });
  const summary = dashboard.data?.summary;
  const breakdowns = dashboard.data?.breakdowns;
  const escalations = dashboard.data?.escalations;

  const cards = summary
    ? [
        { label: 'Requirements', value: summary.totalRequirements },
        { label: 'Open positions', value: summary.openPositions },
        { label: 'Closed positions', value: summary.closedPositions },
        { label: 'Pipeline', value: summary.candidatesInPipeline },
        { label: 'Selected', value: summary.selectedCandidates },
        { label: 'Duplicates', value: summary.duplicateMobiles },
        { label: 'Offers released', value: summary.offersReleased },
        { label: 'Joined', value: summary.candidatesJoined },
        {
          label: 'Fill rate',
          value: `${Math.round(summary.fillRate * 100)}%`,
        },
      ]
    : [];

  return (
    <PageFade>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Pipeline health and SLA escalations
        </p>
      </div>

      {dashboard.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : dashboard.isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load summary.{' '}
          <button className="underline" onClick={() => dashboard.refetch()}>
            Retry
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className="rounded-md border border-border bg-card px-4 py-3"
            >
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                {c.value}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Stage breakdown</h2>
          {dashboard.isLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <ul className="space-y-2 text-sm">
              {(breakdowns?.byStage ?? []).map(
                (s: { stageCode: string; count: number }) => (
                  <li
                    key={s.stageCode}
                    className="flex justify-between border-b border-border/60 py-1.5 last:border-0"
                  >
                    <span className="font-mono text-xs">{s.stageCode}</span>
                    <span className="tabular-nums">{s.count}</span>
                  </li>
                ),
              )}
              {!breakdowns?.byStage?.length && (
                <li className="text-muted-foreground">No candidates yet</li>
              )}
            </ul>
          )}
        </section>

        <section className="rounded-md border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">SLA RAG</h2>
          {dashboard.isLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <ul className="space-y-2 text-sm">
              {(breakdowns?.byRag ?? []).map(
                (r: { rag: Rag; count: number }) => (
                  <li
                    key={r.rag}
                    className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-0"
                  >
                    <RagChip rag={r.rag} />
                    <span className="tabular-nums">{r.count}</span>
                  </li>
                ),
              )}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-md border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Escalations</h2>
        {dashboard.isLoading ? (
          <Skeleton className="h-16" />
        ) : (
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            {(['overdue', 'atRisk', 'cancelled'] as const).map((key) => (
              <div key={key}>
                <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  {key}
                </div>
                <ul className="space-y-1">
                  {(escalations?.[key] ?? []).slice(0, 5).map(
                    (item: {
                      id: string;
                      publicId: string;
                      roleSkill: string;
                    }) => (
                      <li key={item.id} className="truncate">
                        <span className="font-mono text-xs text-primary">
                          {item.publicId}
                        </span>{' '}
                        {item.roleSkill}
                      </li>
                    ),
                  )}
                  {!escalations?.[key]?.length && (
                    <li className="text-muted-foreground">None</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageFade>
  );
}
