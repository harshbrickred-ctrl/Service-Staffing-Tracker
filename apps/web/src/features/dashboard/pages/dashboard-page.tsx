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

export function DashboardPage() {
  const summary = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => (await api.get('/dashboard/summary')).data as Summary,
  });
  const breakdowns = useQuery({
    queryKey: ['dashboard', 'breakdowns'],
    queryFn: async () => (await api.get('/dashboard/breakdowns')).data,
  });
  const escalations = useQuery({
    queryKey: ['dashboard', 'escalations'],
    queryFn: async () => (await api.get('/dashboard/escalations')).data,
  });

  const cards = summary.data
    ? [
        { label: 'Requirements', value: summary.data.totalRequirements },
        { label: 'Open positions', value: summary.data.openPositions },
        { label: 'Closed positions', value: summary.data.closedPositions },
        { label: 'Pipeline', value: summary.data.candidatesInPipeline },
        { label: 'Selected', value: summary.data.selectedCandidates },
        { label: 'Duplicates', value: summary.data.duplicateMobiles },
        { label: 'Offers released', value: summary.data.offersReleased },
        { label: 'Joined', value: summary.data.candidatesJoined },
        {
          label: 'Fill rate',
          value: `${Math.round(summary.data.fillRate * 100)}%`,
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

      {summary.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : summary.isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load summary.{' '}
          <button className="underline" onClick={() => summary.refetch()}>
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
          {breakdowns.isLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <ul className="space-y-2 text-sm">
              {(breakdowns.data?.byStage ?? []).map(
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
              {!breakdowns.data?.byStage?.length && (
                <li className="text-muted-foreground">No candidates yet</li>
              )}
            </ul>
          )}
        </section>

        <section className="rounded-md border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">SLA RAG</h2>
          {breakdowns.isLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <ul className="space-y-2 text-sm">
              {(breakdowns.data?.byRag ?? []).map(
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
        {escalations.isLoading ? (
          <Skeleton className="h-16" />
        ) : (
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            {(['overdue', 'atRisk', 'cancelled'] as const).map((key) => (
              <div key={key}>
                <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  {key}
                </div>
                <ul className="space-y-1">
                  {(escalations.data?.[key] ?? []).slice(0, 5).map(
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
                  {!escalations.data?.[key]?.length && (
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
