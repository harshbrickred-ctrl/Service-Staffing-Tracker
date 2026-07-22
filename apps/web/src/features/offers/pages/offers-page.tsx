import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import api from '@/shared/lib/api';
import { PageFade } from '@/shared/components/page-fade';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useAuth } from '@/features/auth/auth-context';

export function OffersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const list = useQuery({
    queryKey: ['offers'],
    queryFn: async () => (await api.get('/offers')).data,
  });

  const selected = useQuery({
    queryKey: ['candidates-selected'],
    queryFn: async () =>
      (await api.get('/candidates', { params: { selected: 'true', pageSize: 100 } }))
        .data,
  });

  const statuses = useQuery({
    queryKey: ['lookups', 'OFFER_STATUS'],
    queryFn: async () =>
      (await api.get('/master-data/lookups/OFFER_STATUS')).data,
  });

  const create = useMutation({
    mutationFn: async (body: Record<string, unknown>) =>
      (await api.post('/offers', body)).data,
    onSuccess: () => {
      toast.success('Offer created');
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['offers'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => toast.error('Offer create failed (candidate must be selected)'),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, statusCode }: { id: string; statusCode: string }) =>
      (await api.post(`/offers/${id}/status`, { statusCode })).data,
    onSuccess: () => {
      toast.success('Offer status updated');
      qc.invalidateQueries({ queryKey: ['offers'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const canCreate =
    user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'TA';
  const canStatus = user?.role === 'ADMIN' || user?.role === 'HR';

  return (
    <PageFade>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Offers</h1>
          <p className="text-sm text-muted-foreground">
            Offer lifecycle for selected candidates
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : 'New offer'}
          </Button>
        )}
      </div>

      {showForm && (
        <form
          className="mb-6 grid gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            create.mutate({
              candidateId: fd.get('candidateId'),
              statusCode: fd.get('statusCode'),
              ctcRate: fd.get('ctcRate') || undefined,
              offerInitiatedDate: fd.get('offerInitiatedDate') || undefined,
              offerReleasedDate: fd.get('offerReleasedDate') || undefined,
              expectedDoj: fd.get('expectedDoj') || undefined,
            });
          }}
        >
          <div className="space-y-1">
            <Label>Selected candidate</Label>
            <select
              name="candidateId"
              required
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              {(selected.data?.items ?? []).map(
                (c: { id: string; name: string }) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.name}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <select
              name="statusCode"
              required
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
              defaultValue="INITIATED"
            >
              {(statuses.data ?? []).map(
                (s: { code: string; label: string }) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="space-y-1">
            <Label>CTC / rate</Label>
            <Input name="ctcRate" placeholder="18 LPA" />
          </div>
          <div className="space-y-1">
            <Label>Expected DOJ</Label>
            <Input name="expectedDoj" type="date" />
          </div>
          <div className="space-y-1">
            <Label>Initiated</Label>
            <Input name="offerInitiatedDate" type="date" />
          </div>
          <div className="space-y-1">
            <Label>Released</Label>
            <Input name="offerReleasedDate" type="date" />
          </div>
          <div>
            <Button type="submit">Create</Button>
          </div>
        </form>
      )}

      {list.isLoading ? (
        <Skeleton className="h-32" />
      ) : !list.data?.items?.length ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No offers yet. Select a candidate first.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Candidate</th>
                <th className="px-3 py-2">CTC</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.data.items.map(
                (o: {
                  id: string;
                  publicId: string;
                  ctcRate: string | null;
                  statusCode: string;
                  candidate: { name: string };
                }) => (
                  <tr key={o.id} className="border-t border-border/70">
                    <td className="px-3 py-2 font-mono text-xs">
                      <Link
                        to={`/offers/${o.id}`}
                        className="text-primary hover:underline"
                      >
                        {o.publicId}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{o.candidate.name}</td>
                    <td className="px-3 py-2">{o.ctcRate ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-xs">{o.statusCode}</td>
                    <td className="px-3 py-2">
                      {canStatus && (
                        <select
                          className="h-8 rounded-md border border-input bg-card px-2 text-xs"
                          value={o.statusCode}
                          onChange={(e) =>
                            setStatus.mutate({
                              id: o.id,
                              statusCode: e.target.value,
                            })
                          }
                        >
                          {(statuses.data ?? []).map(
                            (s: { code: string; label: string }) => (
                              <option key={s.code} value={s.code}>
                                {s.label}
                              </option>
                            ),
                          )}
                        </select>
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </PageFade>
  );
}
