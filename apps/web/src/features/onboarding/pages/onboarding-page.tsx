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

export function OnboardingPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const list = useQuery({
    queryKey: ['onboardings'],
    queryFn: async () => (await api.get('/onboardings')).data,
  });

  const acceptedOffers = useQuery({
    queryKey: ['offers-accepted'],
    queryFn: async () =>
      (
        await api.get('/offers', {
          params: { statusCode: 'ACCEPTED', pageSize: 100 },
        })
      ).data,
  });

  const bgv = useQuery({
    queryKey: ['lookups', 'BGV_STATUS'],
    queryFn: async () =>
      (await api.get('/master-data/lookups/BGV_STATUS')).data,
  });

  const statuses = useQuery({
    queryKey: ['lookups', 'ONBOARDING_STATUS'],
    queryFn: async () =>
      (await api.get('/master-data/lookups/ONBOARDING_STATUS')).data,
  });

  const create = useMutation({
    mutationFn: async (body: Record<string, unknown>) =>
      (await api.post('/onboardings', body)).data,
    onSuccess: () => {
      toast.success('Onboarding created');
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['onboardings'] });
    },
    onError: () => toast.error('Requires ACCEPTED offer'),
  });

  const setStatus = useMutation({
    mutationFn: async ({
      id,
      statusCode,
      actualDoj,
    }: {
      id: string;
      statusCode: string;
      actualDoj?: string;
    }) =>
      (
        await api.post(`/onboardings/${id}/status`, {
          statusCode,
          actualDoj,
        })
      ).data,
    onSuccess: () => {
      toast.success('Onboarding updated');
      qc.invalidateQueries({ queryKey: ['onboardings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['requirements'] });
      qc.invalidateQueries({ queryKey: ['requirement'] });
    },
  });

  const canEdit = user?.role === 'ADMIN' || user?.role === 'HR';

  return (
    <PageFade>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Onboarding</h1>
          <p className="text-sm text-muted-foreground">
            Docs, BGV, and join tracking
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : 'Start onboarding'}
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
              offerId: fd.get('offerId'),
              hrOwnerId: user?.id,
              bgvStatusCode: fd.get('bgvStatusCode'),
              expectedDoj: fd.get('expectedDoj') || undefined,
              joiningFormalities: fd.get('joiningFormalities') || undefined,
            });
          }}
        >
          <div className="space-y-1">
            <Label>Accepted offer</Label>
            <select
              name="offerId"
              required
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              {(acceptedOffers.data?.items ?? []).map(
                (o: {
                  id: string;
                  publicId: string;
                  candidate: { name: string };
                }) => (
                  <option key={o.id} value={o.id}>
                    {o.publicId} — {o.candidate.name}
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="space-y-1">
            <Label>BGV status</Label>
            <select
              name="bgvStatusCode"
              required
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
              defaultValue="NOT_STARTED"
            >
              {(bgv.data ?? []).map((s: { code: string; label: string }) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Expected DOJ</Label>
            <Input name="expectedDoj" type="date" />
          </div>
          <div className="space-y-1">
            <Label>Formalities</Label>
            <Input name="joiningFormalities" />
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
          No onboardings. Accept an offer to unlock this step.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Candidate</th>
                <th className="px-3 py-2">BGV</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.data.items.map(
                (o: {
                  id: string;
                  publicId: string;
                  bgvStatusCode: string;
                  statusCode: string;
                  candidate: { name: string };
                }) => (
                  <tr key={o.id} className="border-t border-border/70">
                    <td className="px-3 py-2 font-mono text-xs">
                      <Link
                        to={`/onboarding/${o.id}`}
                        className="text-primary hover:underline"
                      >
                        {o.publicId}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{o.candidate.name}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {o.bgvStatusCode}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{o.statusCode}</td>
                    <td className="px-3 py-2">
                      {canEdit && (
                        <select
                          className="h-8 rounded-md border border-input bg-card px-2 text-xs"
                          value={o.statusCode}
                          onChange={(e) =>
                            setStatus.mutate({
                              id: o.id,
                              statusCode: e.target.value,
                              actualDoj:
                                e.target.value === 'JOINED'
                                  ? new Date().toISOString().slice(0, 10)
                                  : undefined,
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
