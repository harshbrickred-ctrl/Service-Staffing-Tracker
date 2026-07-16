import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import api from '@/shared/lib/api';
import { PageFade } from '@/shared/components/page-fade';
import { Skeleton } from '@/shared/components/ui/skeleton';

export function OnboardingDetailPage() {
  const { id } = useParams();
  const detail = useQuery({
    queryKey: ['onboarding', id],
    queryFn: async () => (await api.get(`/onboardings/${id}`)).data,
    enabled: !!id,
  });

  if (detail.isLoading) return <Skeleton className="h-32" />;
  if (!detail.data) return <p className="text-destructive">Not found</p>;
  const o = detail.data;

  return (
    <PageFade>
      <Link to="/onboarding" className="text-sm text-muted-foreground hover:underline">
        ← Onboarding
      </Link>
      <h1 className="mt-2 text-2xl font-semibold font-mono">{o.publicId}</h1>
      <div className="mt-4 grid gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-2 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">Candidate</div>
          {o.candidate?.name}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">HR owner</div>
          {o.hrOwner?.fullName}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Status</div>
          <span className="font-mono text-xs">{o.statusCode}</span>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">BGV</div>
          <span className="font-mono text-xs">{o.bgvStatusCode}</span>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Docs pending</div>
          {o.docsPending ? 'Yes' : 'No'}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Actual DOJ</div>
          {o.actualDoj ? String(o.actualDoj).slice(0, 10) : '—'}
        </div>
      </div>
    </PageFade>
  );
}
