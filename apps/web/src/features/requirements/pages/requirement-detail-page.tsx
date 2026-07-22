import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/shared/lib/api';
import { PageFade } from '@/shared/components/page-fade';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { RagChip } from '@/shared/components/rag-chip';
import { useAuth } from '@/features/auth/auth-context';
import {
  getRequirement,
  listRequirementActivity,
  replaceRequirement,
  setRequirementStatus,
  updateRequirement,
} from '../api/requirements.api';
import type { DirectoryUser } from '../api/requirements.types';
import {
  dashboardKeys,
  requirementKeys,
} from '../hooks/requirement-query-keys';
import { RequirementForm } from '../components/requirement-form';
import { ClosureStatusChip } from '../components/closure-status-chip';
import {
  toRequirementBody,
  type RequirementFormValues,
} from '../requirement.schema';

function toDateInput(value?: string | null) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function money(value?: number | string | null) {
  if (value == null || value === '') return '—';
  return String(value);
}

export function RequirementDetailPage() {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(() => searchParams.get('edit') === '1');
  const [tab, setTab] = useState<'details' | 'candidates' | 'activity'>(
    'details',
  );

  const detail = useQuery({
    queryKey: requirementKeys.detail(id),
    queryFn: () => getRequirement(id),
    enabled: !!id,
  });

  const masters = useQuery({
    queryKey: requirementKeys.masters(),
    queryFn: async () => {
      const [clients, families, priorities, taUsers, salesUsers] =
        await Promise.all([
          api.get('/master-data/clients'),
          api.get('/master-data/job-families'),
          api.get('/master-data/lookups/PRIORITY'),
          api.get('/users/directory', { params: { role: 'TA' } }),
          api.get('/users/directory', { params: { role: 'SALES' } }),
        ]);
      return {
        clients: clients.data as { id: string; name: string }[],
        families: families.data as { id: string; name: string }[],
        priorities: priorities.data as { code: string; label: string }[],
        taUsers: taUsers.data as DirectoryUser[],
        salesUsers: salesUsers.data as DirectoryUser[],
      };
    },
  });

  const candidates = useQuery({
    queryKey: ['candidates', { requirementId: id }],
    enabled: tab === 'candidates' && !!id,
    queryFn: async () =>
      (await api.get('/candidates', { params: { requirementId: id } })).data,
  });

  const activity = useQuery({
    queryKey: requirementKeys.activity(id),
    enabled: tab === 'activity' && !!id && user?.role === 'ADMIN',
    queryFn: () => listRequirementActivity(id),
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: requirementKeys.all });
    qc.invalidateQueries({ queryKey: dashboardKeys.all });
  };

  const status = useMutation({
    mutationFn: async (s: string) => setRequirementStatus(id, s),
    onSuccess: () => {
      toast.success('Status updated');
      invalidateAll();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      toast.error(
        Array.isArray(msg) ? msg.join(', ') : msg || 'Status update failed',
      );
    },
  });

  const update = useMutation({
    mutationFn: async (values: RequirementFormValues) => {
      const current = detail.data;
      if (!current) throw new Error('Requirement not loaded');

      if (user?.role === 'TA') {
        const body = toRequirementBody(values, current.salesOwnerId);
        return updateRequirement(id, {
          taOwnerId: body.taOwnerId,
          taHandoffDate: body.taHandoffDate,
          remarks: body.remarks,
        });
      }
      const salesOwnerId =
        user?.role === 'ADMIN'
          ? values.salesOwnerId || current.salesOwnerId
          : current.salesOwnerId;
      return replaceRequirement(id, toRequirementBody(values, salesOwnerId));
    },
    onSuccess: (updated) => {
      toast.success('Requirement updated');
      setEditing(false);
      setSearchParams({}, { replace: true });
      qc.setQueryData(requirementKeys.detail(id), updated);
      invalidateAll();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      toast.error(
        Array.isArray(msg) ? msg.join(', ') : msg || 'Update failed',
      );
    },
  });

  useEffect(() => {
    setEditing(searchParams.get('edit') === '1');
  }, [id, searchParams]);

  const setEditingMode = (next: boolean) => {
    setEditing(next);
    if (next) {
      setSearchParams({ edit: '1' }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  if (detail.isLoading) return <Skeleton className="h-40" />;
  if (detail.isError || !detail.data) {
    return (
      <p className="text-destructive">
        Requirement not found.{' '}
        <button className="underline" onClick={() => detail.refetch()}>
          Retry
        </button>
      </p>
    );
  }

  const r = detail.data;
  const canEditFull =
    user?.role === 'ADMIN' ||
    (user?.role === 'SALES' && r.salesOwnerId === user.id);
  const canEditTa =
    user?.role === 'TA' && (!r.taOwnerId || r.taOwnerId === user.id);
  const canEdit = canEditFull || canEditTa;
  const canStatus = user?.role === 'ADMIN' || user?.role === 'SALES';

  const formDefaults: RequirementFormValues = {
    requirementDate: toDateInput(r.requirementDate),
    clientId: r.clientId,
    roleSkill: r.roleSkill,
    jobFamilyId: r.jobFamilyId,
    numberOfPositions: r.numberOfPositions,
    salesOwnerId: r.salesOwnerId,
    priorityCode: r.priorityCode,
    taOwnerId: r.taOwnerId ?? '',
    taHandoffDate: toDateInput(r.taHandoffDate),
    targetClosureDate: toDateInput(r.targetClosureDate),
    remarks: r.remarks ?? '',
    experience: r.experience ?? '',
    jobLocation: r.jobLocation ?? '',
    minBudget: r.minBudget == null ? '' : Number(r.minBudget),
    maxBudget: r.maxBudget == null ? '' : Number(r.maxBudget),
    durationMonths: r.durationMonths ?? '',
  };

  return (
    <PageFade>
      <div className="mb-4">
        <Link
          to="/requirements"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Requirements
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{r.roleSkill}</h1>
          <p className="font-mono text-sm text-primary">{r.publicId}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RagChip rag={r.taHandoffSlaRag} />
          <ClosureStatusChip status={r.closureStatus} />
          {canStatus && (
            <select
              className="h-9 rounded-md border border-input bg-card px-2 text-sm"
              value={r.status}
              onChange={(e) => {
                const next = e.target.value;
                if (
                  (next === 'CANCELLED' || next === 'CLOSED') &&
                  !window.confirm(`Mark requirement as ${next}?`)
                ) {
                  return;
                }
                status.mutate(next);
              }}
            >
              {['ACTIVE', 'ON_HOLD', 'CANCELLED', 'CLOSED'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditingMode(!editing)}
            >
              {editing ? 'Cancel' : canEditFull ? 'Edit' : 'Edit TA fields'}
            </Button>
          )}
        </div>
      </div>

      {r.closureStatus === 'OVERDUE' && (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Closure warning: target closure date has passed and open positions
          remain.
        </div>
      )}

      <div className="mb-4 grid gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5 text-sm">
        <Field label="Requirement Age" value={`${r.requirementAgeDays} days`} />
        <Field label="Open Positions" value={String(r.openPositions)} />
        <Field label="Closed Positions" value={String(r.closedPositions)} />
        <Field label="TA Handoff SLA" value={r.taHandoffSlaRag} />
        <Field label="Closure Status" value={r.closureStatus} />
      </div>

      <div className="mb-4 flex gap-2 border-b border-border pb-2 text-sm">
        {(['details', 'candidates', 'activity'] as const).map((t) => (
          <button
            key={t}
            className={`rounded-md px-3 py-1.5 capitalize ${
              tab === t ? 'bg-accent font-medium' : 'text-muted-foreground'
            }`}
            onClick={() => setTab(t)}
            type="button"
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <>
          {editing ? (
            <div className="mb-4">
              {masters.isLoading || !masters.data ? (
                <Skeleton className="h-64" />
              ) : masters.isError ? (
                <p className="text-sm text-destructive">
                  Failed to load form data.{' '}
                  <button
                    className="underline"
                    type="button"
                    onClick={() => masters.refetch()}
                  >
                    Retry
                  </button>
                </p>
              ) : (
                <RequirementForm
                  key={r.updatedAt ?? r.id}
                  masters={masters.data}
                  defaultValues={formDefaults}
                  submitLabel="Save changes"
                  isPending={update.isPending}
                  showSalesOwner={user?.role === 'ADMIN'}
                  taFieldsOnly={user?.role === 'TA'}
                  onCancel={() => setEditingMode(false)}
                  onSubmit={(values) => update.mutate(values)}
                />
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              <Section title="Core">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                  <Field label="Req Id" value={r.publicId} mono />
                  <Field
                    label="Requirement Date"
                    value={toDateInput(r.requirementDate)}
                  />
                  <Field label="Client Name" value={r.client?.name ?? '—'} />
                  <Field label="Role/Skill" value={r.roleSkill} />
                  <Field label="Job Family" value={r.jobFamily?.name ?? '—'} />
                  <Field
                    label="Number Of Positions"
                    value={String(r.numberOfPositions)}
                  />
                  <Field
                    label="Sales Owner"
                    value={r.salesOwner?.fullName ?? '—'}
                  />
                  <Field label="Priority" value={r.priorityCode} mono />
                  <Field label="Requirement Status" value={r.status} mono />
                </div>
              </Section>
              <Section title="Owners & Dates">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                  <Field label="TA Owner" value={r.taOwner?.fullName ?? '—'} />
                  <Field
                    label="TA Handoff Date"
                    value={toDateInput(r.taHandoffDate) || '—'}
                  />
                  <Field
                    label="Target Closure Date"
                    value={toDateInput(r.targetClosureDate) || '—'}
                  />
                </div>
              </Section>
              <Section title="Commercials">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                  <Field label="Experience" value={r.experience ?? '—'} />
                  <Field label="Job Location" value={r.jobLocation ?? '—'} />
                  <Field label="Min Budget" value={money(r.minBudget)} />
                  <Field label="Max Budget" value={money(r.maxBudget)} />
                  <Field
                    label="Duration of Project (Months)"
                    value={
                      r.durationMonths != null ? String(r.durationMonths) : '—'
                    }
                  />
                </div>
              </Section>
              <Section title="Remarks">
                <p className="text-sm">{r.remarks || '—'}</p>
              </Section>
            </div>
          )}
        </>
      )}

      {tab === 'candidates' && (
        <div className="rounded-md border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium">Candidates</h3>
            <Button asChild size="sm" variant="outline">
              <Link to={`/candidates?requirementId=${r.id}`}>
                Open candidates
              </Link>
            </Button>
          </div>
          {candidates.isLoading ? (
            <Skeleton className="h-24" />
          ) : !candidates.data?.items?.length ? (
            <p className="text-sm text-muted-foreground">
              No candidates linked yet.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {candidates.data.items.map(
                (c: {
                  id: string;
                  name: string;
                  stageCode: string;
                  selected: boolean;
                }) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between border-b border-border/60 py-2"
                  >
                    <Link
                      className="text-primary hover:underline"
                      to={`/candidates/${c.id}`}
                    >
                      {c.id} — {c.name}
                    </Link>
                    <span className="font-mono text-xs text-muted-foreground">
                      {c.stageCode}
                      {c.selected ? ' · SELECTED' : ''}
                    </span>
                  </li>
                ),
              )}
            </ul>
          )}
        </div>
      )}

      {tab === 'activity' && (
        <div className="rounded-md border border-border bg-card p-4">
          {user?.role !== 'ADMIN' ? (
            <p className="text-sm text-muted-foreground">
              Activity / audit history is available to Admin users.
            </p>
          ) : activity.isLoading ? (
            <Skeleton className="h-24" />
          ) : !activity.data?.items?.length ? (
            <p className="text-sm text-muted-foreground">No audit entries.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {activity.data.items.map((a) => (
                <li key={a.id} className="border-b border-border/60 pb-2">
                  <div className="font-medium">
                    {a.action}{' '}
                    <span className="text-muted-foreground">
                      by {a.actor?.fullName ?? 'system'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </PageFade>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={mono ? 'font-mono' : ''}>{value}</div>
    </div>
  );
}
