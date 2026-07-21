import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import api from '@/shared/lib/api';
import { PageFade } from '@/shared/components/page-fade';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useAuth } from '@/features/auth/auth-context';
import { requirementKeys } from '@/features/requirements/hooks/requirement-query-keys';
import { AdminUsersPanel } from '../components/admin-users-panel';

export function AdminPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'users' | 'masters' | 'audit' | 'import'>(
    'users',
  );

  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;

  const clients = useQuery({
    queryKey: ['clients'],
    queryFn: async () => (await api.get('/master-data/clients')).data,
    enabled: tab === 'masters',
  });

  const families = useQuery({
    queryKey: ['job-families'],
    queryFn: async () => (await api.get('/master-data/job-families')).data,
    enabled: tab === 'masters',
  });

  const audits = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => (await api.get('/audit-logs')).data,
    enabled: tab === 'audit',
  });

  const createClient = useMutation({
    mutationFn: async (name: string) =>
      (await api.post('/master-data/clients', { name })).data,
    onSuccess: () => {
      toast.success('Client created');
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: requirementKeys.masters() });
    },
  });

  const createFamily = useMutation({
    mutationFn: async (name: string) =>
      (await api.post('/master-data/job-families', { name })).data,
    onSuccess: () => {
      toast.success('Job family created');
      qc.invalidateQueries({ queryKey: ['job-families'] });
      qc.invalidateQueries({ queryKey: requirementKeys.masters() });
    },
  });

  const importCommit = useMutation({
    mutationFn: async ({
      entity,
      csv,
    }: {
      entity: string;
      csv: string;
    }) => (await api.post('/imports/commit', { entity, csv })).data,
    onSuccess: (data) => {
      toast.success(`Imported ${data.created} rows`);
      qc.invalidateQueries({ queryKey: ['requirements'] });
      qc.invalidateQueries({ queryKey: ['candidates'] });
    },
    onError: () => toast.error('Import failed'),
  });

  const tabs = [
    { id: 'users' as const, label: 'Users' },
    { id: 'masters' as const, label: 'Masters' },
    { id: 'audit' as const, label: 'Audit' },
    { id: 'import' as const, label: 'Import' },
  ];

  return (
    <PageFade>
      <h1 className="mb-1 text-2xl font-semibold">Admin</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Manage users by role, masters, audit trail, and CSV import
      </p>
      <div className="mb-4 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm transition-colors ${
              tab === t.id
                ? 'border-b-2 border-primary font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && <AdminUsersPanel />}

      {tab === 'masters' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-2 text-sm font-semibold">Clients</h2>
            <form
              className="mb-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                createClient.mutate(String(fd.get('name')));
                e.currentTarget.reset();
              }}
            >
              <Input name="name" placeholder="Client name" required />
              <Button type="submit">Add</Button>
            </form>
            <ul className="rounded-md border border-border bg-card divide-y divide-border text-sm">
              {(clients.data ?? []).map((c: { id: string; name: string }) => (
                <li key={c.id} className="px-3 py-2">
                  {c.name}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-semibold">Job families</h2>
            <form
              className="mb-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                createFamily.mutate(String(fd.get('name')));
                e.currentTarget.reset();
              }}
            >
              <Input name="name" placeholder="Family name" required />
              <Button type="submit">Add</Button>
            </form>
            <ul className="rounded-md border border-border bg-card divide-y divide-border text-sm">
              {(families.data ?? []).map((c: { id: string; name: string }) => (
                <li key={c.id} className="px-3 py-2">
                  {c.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'audit' &&
        (audits.isLoading ? (
          <Skeleton className="h-40" />
        ) : (
          <table className="w-full text-sm rounded-md border border-border bg-card">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Entity</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Actor</th>
              </tr>
            </thead>
            <tbody>
              {(audits.data?.items ?? []).map(
                (a: {
                  id: string;
                  createdAt: string;
                  entityType: string;
                  entityId: string;
                  action: string;
                  actor?: { fullName: string };
                }) => (
                  <tr key={a.id} className="border-t border-border/70">
                    <td className="px-3 py-2 text-xs">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {a.entityType}:{a.entityId.slice(0, 8)}
                    </td>
                    <td className="px-3 py-2">{a.action}</td>
                    <td className="px-3 py-2">{a.actor?.fullName ?? '—'}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        ))}

      {tab === 'import' && (
        <div className="space-y-4 max-w-2xl">
          <p className="text-sm text-muted-foreground">
            Paste CSV with headers. Requirements:{' '}
            <code className="font-mono text-xs">
              requirementDate,clientName,roleSkill,jobFamilyName,numberOfPositions,salesOwnerEmail,priorityCode
            </code>
          </p>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              importCommit.mutate({
                entity: String(fd.get('entity')),
                csv: String(fd.get('csv')),
              });
            }}
          >
            <div className="space-y-1">
              <Label>Entity</Label>
              <select
                name="entity"
                className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm"
              >
                <option value="requirements">Requirements</option>
                <option value="candidates">Candidates</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>CSV</Label>
              <Textarea
                name="csv"
                rows={8}
                required
                placeholder={'header\nrow…'}
              />
            </div>
            <Button type="submit" disabled={importCommit.isPending}>
              Validate & commit
            </Button>
          </form>
        </div>
      )}
    </PageFade>
  );
}
