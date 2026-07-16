import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/shared/lib/api';
import { PageFade } from '@/shared/components/page-fade';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { RagChip } from '@/shared/components/rag-chip';
import type { Rag } from '@sst/shared-types';
import { useAuth } from '@/features/auth/auth-context';

type DirectoryUser = { id: string; fullName: string; email: string };

function toDateInput(value?: string | null) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export function RequirementDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [taOwnerId, setTaOwnerId] = useState('');
  const [taHandoffDate, setTaHandoffDate] = useState('');
  const [targetClosureDate, setTargetClosureDate] = useState('');

  const detail = useQuery({
    queryKey: ['requirement', id],
    queryFn: async () => (await api.get(`/requirements/${id}`)).data,
    enabled: !!id,
  });

  const taUsers = useQuery({
    queryKey: ['directory', 'TA'],
    queryFn: async () =>
      (await api.get('/users/directory', { params: { role: 'TA' } }))
        .data as DirectoryUser[],
    enabled: editing,
  });

  useEffect(() => {
    if (detail.data) {
      setTaOwnerId(detail.data.taOwnerId ?? '');
      setTaHandoffDate(toDateInput(detail.data.taHandoffDate));
      setTargetClosureDate(toDateInput(detail.data.targetClosureDate));
    }
  }, [detail.data]);

  const status = useMutation({
    mutationFn: async (s: string) =>
      (await api.post(`/requirements/${id}/status`, { status: s })).data,
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['requirement', id] });
      qc.invalidateQueries({ queryKey: ['requirements'] });
    },
  });

  const update = useMutation({
    mutationFn: async () =>
      (
        await api.patch(`/requirements/${id}`, {
          taOwnerId: taOwnerId || null,
          taHandoffDate: taHandoffDate || null,
          targetClosureDate: targetClosureDate || null,
        })
      ).data,
    onSuccess: () => {
      toast.success('TA assignment and dates updated');
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['requirement', id] });
      qc.invalidateQueries({ queryKey: ['requirements'] });
    },
    onError: () => toast.error('Update failed'),
  });

  if (detail.isLoading) return <Skeleton className="h-40" />;
  if (!detail.data) return <p className="text-destructive">Not found</p>;

  const r = detail.data;
  const canEdit =
    user?.role === 'ADMIN' || user?.role === 'SALES' || user?.role === 'TA';
  const canStatus = user?.role === 'ADMIN' || user?.role === 'SALES';

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
          <RagChip rag={r.taHandoffSlaRag as Rag} />
          {canStatus && (
            <select
              className="h-9 rounded-md border border-input bg-card px-2 text-sm"
              value={r.status}
              onChange={(e) => status.mutate(e.target.value)}
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
              onClick={() => setEditing((e) => !e)}
            >
              {editing ? 'Cancel edit' : 'Edit TA / dates'}
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link to={`/candidates?requirementId=${r.id}`}>Candidates</Link>
          </Button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-3 text-sm">
        <Field
          label="Requirement age (auto)"
          value={`${r.requirementAgeDays} days`}
        />
        <Field label="Open positions (auto)" value={String(r.openPositions)} />
        <Field
          label="Closed positions (auto)"
          value={String(r.closedPositions)}
        />
      </div>

      {editing && (
        <form
          className="mb-4 grid gap-3 rounded-md border border-primary/20 bg-accent/30 p-4 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            update.mutate();
          }}
        >
          <div className="space-y-1">
            <Label>Assign to TA</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
              value={taOwnerId}
              onChange={(e) => setTaOwnerId(e.target.value)}
              required
            >
              <option value="" disabled>
                Select TA…
              </option>
              {(taUsers.data ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>TA handoff date</Label>
            <Input
              type="date"
              value={taHandoffDate}
              onChange={(e) => setTaHandoffDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>TA closure date</Label>
            <Input
              type="date"
              value={targetClosureDate}
              onChange={(e) => setTargetClosureDate(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={update.isPending}>
              Save assignment
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-4 rounded-md border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
        <Field label="Client" value={r.client?.name} />
        <Field label="Job family" value={r.jobFamily?.name} />
        <Field label="Priority" value={r.priorityCode} mono />
        <Field label="Sales owner" value={r.salesOwner?.fullName} />
        <Field label="TA owner" value={r.taOwner?.fullName ?? '—'} />
        <Field
          label="Total positions"
          value={String(r.numberOfPositions)}
        />
        <Field
          label="TA handoff date"
          value={toDateInput(r.taHandoffDate) || '—'}
        />
        <Field
          label="TA closure date"
          value={toDateInput(r.targetClosureDate) || '—'}
        />
        <Field label="Location" value={r.jobLocation ?? '—'} />
        <Field label="Experience" value={r.experience ?? '—'} />
      </div>
    </PageFade>
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
