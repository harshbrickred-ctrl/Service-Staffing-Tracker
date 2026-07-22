import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/shared/lib/api';
import { PageFade } from '@/shared/components/page-fade';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { useAuth } from '@/features/auth/auth-context';

export function CandidatesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const requirementId = params.get('requirementId') ?? '';
  const [showForm, setShowForm] = useState(!!requirementId);
  const [q, setQ] = useState('');
  const canEdit = user?.role === 'ADMIN' || user?.role === 'TA';

  const list = useQuery({
    queryKey: ['candidates', requirementId, q],
    queryFn: async () =>
      (
        await api.get('/candidates', {
          params: {
            requirementId: requirementId || undefined,
            q: q || undefined,
          },
        })
      ).data,
  });

  const reqs = useQuery({
    queryKey: ['requirements-options'],
    queryFn: async () =>
      (await api.get('/requirements', { params: { pageSize: 100 } })).data,
  });

  const stages = useQuery({
    queryKey: ['lookups', 'CANDIDATE_STAGE'],
    queryFn: async () =>
      (await api.get('/master-data/lookups/CANDIDATE_STAGE')).data,
  });

  const candidateStatuses = useQuery({
    queryKey: ['master', 'candidate-status'],
    queryFn: async () =>
      (await api.get('/master-data/candidate-status')).data as string[],
    enabled: canEdit,
  });

  const create = useMutation({
    mutationFn: async (body: Record<string, unknown>) =>
      (await api.post('/candidates', body)).data,
    onSuccess: (data) => {
      if (data.duplicateMobile || data.duplicateEmail) {
        toast.warning('Created with duplicate mobile/email warning');
      } else toast.success('Candidate created');
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['candidates'] });
      qc.invalidateQueries({ queryKey: ['requirements'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toast.error('Failed to create candidate'),
  });

  const select = useMutation({
    mutationFn: async ({ id, selected }: { id: string; selected: boolean }) =>
      (await api.post(`/candidates/${id}/select`, { selected })).data,
    onSuccess: () => {
      toast.success('Selection updated');
      qc.invalidateQueries({ queryKey: ['candidates'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toast.error('Select failed'),
  });

  return (
    <PageFade>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Candidates</h1>
          <p className="text-sm text-muted-foreground">
            Pipeline stages, duplicates, and selection
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search…"
            className="w-48"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {canEdit && (
            <Button onClick={() => setShowForm((s) => !s)}>
              {showForm ? 'Cancel' : 'Add candidate'}
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <form
          className="mb-6 grid gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            create.mutate({
              requirementId: fd.get('requirementId'),
              name: fd.get('name'),
              mobile: fd.get('mobile'),
              email: fd.get('email'),
              source: fd.get('source') || undefined,
              stageCode: fd.get('stageCode'),
              candidateStatus: fd.get('candidateStatus') || undefined,
              profileSubmittedDate: fd.get('profileSubmittedDate') || undefined,
            });
          }}
        >
          <div className="space-y-1 sm:col-span-2">
            <Label>Requirement</Label>
            <select
              name="requirementId"
              required
              defaultValue={requirementId}
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              {(reqs.data?.items ?? []).map(
                (r: { id: string; publicId: string; roleSkill: string }) => (
                  <option key={r.id} value={r.id}>
                    {r.publicId} — {r.roleSkill}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Name</Label>
            <Input name="name" required />
          </div>
          <div className="space-y-1">
            <Label>Mobile</Label>
            <Input name="mobile" required />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input name="email" type="email" required />
          </div>
          <div className="space-y-1">
            <Label>Stage</Label>
            <select
              name="stageCode"
              required
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
              defaultValue="SUBMITTED_TO_SPOC"
            >
              {(stages.data ?? []).map(
                (s: { code: string; label: string }) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Candidate status</Label>
            <select
              name="candidateStatus"
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
              defaultValue="Pending"
            >
              {(candidateStatuses.data ?? ['Pending']).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Source</Label>
            <Input name="source" />
          </div>
          <div className="space-y-1">
            <Label>Profile submitted</Label>
            <Input name="profileSubmittedDate" type="date" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" disabled={create.isPending}>
              Create
            </Button>
          </div>
        </form>
      )}

      {list.isLoading ? (
        <Skeleton className="h-40" />
      ) : !list.data?.items?.length ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center">
          <p className="font-medium">No candidates</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add profiles against an open requirement.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Requirement</th>
                <th className="px-3 py-2">Stage</th>
                <th className="px-3 py-2">Flags</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.data.items.map(
                (
                  c: {
                    id: string;
                    name: string;
                    stageCode: string;
                    selected: boolean;
                    requirement: { publicId: string; roleSkill: string };
                  },
                  i: number,
                ) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-t border-border/70"
                  >
                    <td className="px-3 py-2 font-mono text-xs">
                      <Link
                        to={`/candidates/${c.id}`}
                        className="text-primary hover:underline"
                      >
                        {c.id}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2 text-xs">
                      {c.requirement.publicId} — {c.requirement.roleSkill}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{c.stageCode}</td>
                    <td className="px-3 py-2">
                      {c.selected && <Badge variant="success">Selected</Badge>}
                    </td>
                    <td className="px-3 py-2">
                      {canEdit && (
                        <Button
                          size="sm"
                          variant={c.selected ? 'outline' : 'default'}
                          onClick={() =>
                            select.mutate({ id: c.id, selected: !c.selected })
                          }
                        >
                          {c.selected ? 'Unselect' : 'Select'}
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </PageFade>
  );
}
