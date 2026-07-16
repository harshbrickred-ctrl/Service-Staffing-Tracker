import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import api from '@/shared/lib/api';
import { PageFade } from '@/shared/components/page-fade';
import { Skeleton } from '@/shared/components/ui/skeleton';

export function OfferDetailPage() {
  const { id } = useParams();
  const detail = useQuery({
    queryKey: ['offer', id],
    queryFn: async () => (await api.get(`/offers/${id}`)).data,
    enabled: !!id,
  });

  if (detail.isLoading) return <Skeleton className="h-32" />;
  if (!detail.data) return <p className="text-destructive">Not found</p>;
  const o = detail.data;

  return (
    <PageFade>
      <Link to="/offers" className="text-sm text-muted-foreground hover:underline">
        ← Offers
      </Link>
      <h1 className="mt-2 text-2xl font-semibold font-mono">{o.publicId}</h1>
      <div className="mt-4 grid gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-2 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">Candidate</div>
          {o.candidate?.name}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Status</div>
          <span className="font-mono text-xs">{o.statusCode}</span>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">CTC</div>
          {o.ctcRate ?? '—'}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Expected DOJ</div>
          {o.expectedDoj ? String(o.expectedDoj).slice(0, 10) : '—'}
        </div>
      </div>
    </PageFade>
  );
}
