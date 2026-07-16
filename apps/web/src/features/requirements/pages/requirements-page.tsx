import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
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

type DirectoryUser = { id: string; fullName: string; email: string; role: string };

export function RequirementsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [positionsPreview, setPositionsPreview] = useState(1);

  const list = useQuery({
    queryKey: ['requirements', q],
    queryFn: async () =>
      (await api.get('/requirements', { params: { q: q || undefined } })).data,
  });

  const masters = useQuery({
    queryKey: ['masters-for-req', user?.role],
    enabled: showForm,
    queryFn: async () => {
      const [clients, families, priorities, taUsers, salesUsers] =
        await Promise.all([
          api.get('/master-data/clients'),
          api.get('/master-data/job-families'),
          api.get('/master-data/lookups/PRIORITY'),
          api.get('/users/directory', { params: { role: 'TA' } }),
          user?.role === 'ADMIN'
            ? api.get('/users/directory', { params: { role: 'SALES' } })
            : Promise.resolve({ data: [] as DirectoryUser[] }),
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

  const create = useMutation({
    mutationFn: async (body: Record<string, unknown>) =>
      (await api.post('/requirements', body)).data,
    onSuccess: () => {
      toast.success('Requirement created — age and open/closed positions are calculated automatically');
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['requirements'] });
    },
    onError: () => toast.error('Failed to create requirement'),
  });

  const canCreate = user?.role === 'ADMIN' || user?.role === 'SALES';

  return (
    <PageFade>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Requirements</h1>
          <p className="text-sm text-muted-foreground">
            Sales creates demand, assigns a TA, and sets handoff / closure dates.
            Age and open vs closed positions are computed automatically.
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search…"
            className="w-48"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search requirements"
          />
          {canCreate && (
            <Button onClick={() => setShowForm((s) => !s)}>
              {showForm ? 'Cancel' : 'New requirement'}
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="mb-6 rounded-md border border-border bg-card p-4">
          {!masters.data ? (
            <Skeleton className="h-32" />
          ) : (
            <form
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const taOwnerId = String(fd.get('taOwnerId') || '');
                if (!taOwnerId) {
                  toast.error('Assign a TA user');
                  return;
                }
                create.mutate({
                  requirementDate: fd.get('requirementDate'),
                  clientId: fd.get('clientId'),
                  roleSkill: fd.get('roleSkill'),
                  jobFamilyId: fd.get('jobFamilyId'),
                  numberOfPositions: Number(fd.get('numberOfPositions')),
                  salesOwnerId: fd.get('salesOwnerId') || user?.id,
                  priorityCode: fd.get('priorityCode'),
                  taOwnerId,
                  taHandoffDate: fd.get('taHandoffDate') || undefined,
                  targetClosureDate: fd.get('targetClosureDate') || undefined,
                  jobLocation: fd.get('jobLocation') || undefined,
                  experience: fd.get('experience') || undefined,
                  remarks: fd.get('remarks') || undefined,
                });
              }}
            >
              <div className="sm:col-span-2 lg:col-span-3 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                After save: <strong>Requirement age</strong> = days since requirement
                date · <strong>Open positions</strong> = total − joined ·{' '}
                <strong>Closed positions</strong> = candidates marked Joined (auto).
              </div>

              <div className="space-y-1">
                <Label>Requirement date</Label>
                <Input
                  name="requirementDate"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div className="space-y-1">
                <Label>Role / skill</Label>
                <Input
                  name="roleSkill"
                  required
                  placeholder="e.g. Python Developer"
                />
              </div>
              <div className="space-y-1">
                <Label>Number of positions</Label>
                <Input
                  name="numberOfPositions"
                  type="number"
                  min={1}
                  defaultValue={1}
                  required
                  onChange={(e) =>
                    setPositionsPreview(Math.max(1, Number(e.target.value) || 1))
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  Starts as {positionsPreview} open / 0 closed
                </p>
              </div>

              <div className="space-y-1">
                <Label>Client</Label>
                <select
                  name="clientId"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                >
                  {masters.data.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Job family</Label>
                <select
                  name="jobFamilyId"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                >
                  {masters.data.families.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Priority</Label>
                <select
                  name="priorityCode"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                >
                  {masters.data.priorities.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {user?.role === 'ADMIN' && (
                <div className="space-y-1">
                  <Label>Sales owner</Label>
                  <select
                    name="salesOwnerId"
                    className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                    defaultValue={user.id}
                  >
                    <option value={user.id}>{user.fullName} (you)</option>
                    {masters.data.salesUsers
                      .filter((u) => u.id !== user.id)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <Label>Assign to TA</Label>
                <select
                  name="taOwnerId"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select TA user…
                  </option>
                  {masters.data.taUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
                </select>
                {!masters.data.taUsers.length && (
                  <p className="text-[11px] text-destructive">
                    No TA users yet — ask Admin to create TA accounts first.
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>TA handoff date</Label>
                <Input name="taHandoffDate" type="date" required />
              </div>
              <div className="space-y-1">
                <Label>TA closure date</Label>
                <Input name="targetClosureDate" type="date" required />
                <p className="text-[11px] text-muted-foreground">
                  Target date for TA to close the requirement (SLA)
                </p>
              </div>

              <div className="space-y-1">
                <Label>Location</Label>
                <Input name="jobLocation" />
              </div>
              <div className="space-y-1">
                <Label>Experience</Label>
                <Input name="experience" />
              </div>
              <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                <Label>Remarks</Label>
                <Input name="remarks" />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <Button
                  type="submit"
                  disabled={
                    create.isPending || masters.data.taUsers.length === 0
                  }
                >
                  Create requirement
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {list.isLoading ? (
        <Skeleton className="h-40" />
      ) : list.isError ? (
        <div className="text-sm text-destructive">
          Failed to load.{' '}
          <button className="underline" onClick={() => list.refetch()}>
            Retry
          </button>
        </div>
      ) : !list.data?.items?.length ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center">
          <p className="font-medium">No requirements yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sales can create a requirement and assign it to any TA user.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Client</th>
                <th className="px-3 py-2 font-medium">TA</th>
                <th className="px-3 py-2 font-medium">Open</th>
                <th className="px-3 py-2 font-medium">Closed</th>
                <th className="px-3 py-2 font-medium">Age</th>
                <th className="px-3 py-2 font-medium">SLA</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.data.items.map(
                (
                  r: {
                    id: string;
                    publicId: string;
                    roleSkill: string;
                    client: { name: string };
                    taOwner?: { fullName: string } | null;
                    openPositions: number;
                    closedPositions: number;
                    numberOfPositions: number;
                    requirementAgeDays: number;
                    taHandoffSlaRag: Rag;
                    status: string;
                  },
                  i: number,
                ) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-t border-border/70 hover:bg-accent/40"
                  >
                    <td className="px-3 py-2 font-mono text-xs">
                      <Link
                        className="text-primary hover:underline"
                        to={`/requirements/${r.id}`}
                      >
                        {r.publicId}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{r.roleSkill}</td>
                    <td className="px-3 py-2">{r.client.name}</td>
                    <td className="px-3 py-2">{r.taOwner?.fullName ?? '—'}</td>
                    <td className="px-3 py-2 tabular-nums">{r.openPositions}</td>
                    <td className="px-3 py-2 tabular-nums">{r.closedPositions}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {r.requirementAgeDays}d
                    </td>
                    <td className="px-3 py-2">
                      <RagChip rag={r.taHandoffSlaRag} />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{r.status}</td>
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
