import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import api from '@/shared/lib/api';
import { PageFade } from '@/shared/components/page-fade';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';

export function CandidateDetailPage() {
  const { id } = useParams();
  const detail = useQuery({
    queryKey: ['candidate', id],
    queryFn: async () => (await api.get(`/candidates/${id}`)).data,
    enabled: !!id,
  });

  if (detail.isLoading) return <Skeleton className="h-40" />;
  if (!detail.data) return <p className="text-destructive">Not found</p>;
  const c = detail.data;

  return (
    <PageFade>
      <Link to="/candidates" className="text-sm text-muted-foreground hover:underline">
        ← Candidates
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{c.name}</h1>
      <p className="font-mono text-sm text-primary">{c.id}</p>
      {(c.duplicateMobile || c.duplicateEmail) && (
        <div className="mt-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
          Duplicate warning:{' '}
          {c.duplicateMobile && 'mobile used elsewhere'}
          {c.duplicateMobile && c.duplicateEmail && '; '}
          {c.duplicateEmail && 'email used elsewhere'}
        </div>
      )}
      <div className="mt-6 grid gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-2 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">Email</div>
          {c.email}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Mobile</div>
          {c.mobile}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Stage</div>
          <span className="font-mono text-xs">{c.stageCode}</span>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Candidate status</div>
          {c.candidateStatus ?? '—'}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Selected</div>
          {c.selected ? (
            <Badge variant="success">Yes</Badge>
          ) : (
            <Badge variant="muted">No</Badge>
          )}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Requirement</div>
          {c.requirement?.publicId} — {c.requirement?.roleSkill}
        </div>
      </div>
    </PageFade>
  );
}
