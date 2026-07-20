import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/shared/lib/api';
import { PageFade } from '@/shared/components/page-fade';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { RagChip } from '@/shared/components/rag-chip';
import { useAuth } from '@/features/auth/auth-context';
import { listRequirements, createRequirement } from '../api/requirements.api';
import type {
  DirectoryUser,
  RequirementListParams,
} from '../api/requirements.types';
import {
  dashboardKeys,
  requirementKeys,
} from '../hooks/requirement-query-keys';
import { RequirementFilterBar } from '../components/requirement-filter-bar';
import { RequirementForm } from '../components/requirement-form';
import { ClosureStatusChip } from '../components/closure-status-chip';
import {
  toCreateBody,
  type RequirementFormValues,
} from '../requirement.schema';

function useDebounced<T>(value: T, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function RequirementsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<RequirementListParams>(() => ({
    page: 1,
    pageSize: 25,
    sort: 'requirementDate:desc',
    ...(user?.role === 'SALES' ? { salesOwnerId: user.id } : {}),
    ...(user?.role === 'TA' ? { taOwnerId: user.id } : {}),
  }));
  const debouncedQ = useDebounced(filters.q, 350);
  const queryParams = useMemo(
    () => ({ ...filters, q: debouncedQ }),
    [filters, debouncedQ],
  );

  const list = useQuery({
    queryKey: requirementKeys.list(queryParams),
    queryFn: () => listRequirements(queryParams),
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

  const create = useMutation({
    mutationFn: createRequirement,
    onSuccess: (created) => {
      toast.success('Requirement created');
      setShowForm(false);
      qc.invalidateQueries({ queryKey: requirementKeys.all });
      qc.invalidateQueries({ queryKey: dashboardKeys.all });
      navigate(`/requirements/${created.id}`);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      toast.error(
        Array.isArray(msg)
          ? msg.join(', ')
          : msg || 'Failed to create requirement',
      );
    },
  });

  const canCreate = user?.role === 'ADMIN' || user?.role === 'SALES';
  const totalPages = list.data?.totalPages ?? 1;

  const defaultFormValues: RequirementFormValues = {
    requirementDate: new Date().toISOString().slice(0, 10),
    clientId: masters.data?.clients[0]?.id ?? '',
    roleSkill: '',
    jobFamilyId: masters.data?.families[0]?.id ?? '',
    numberOfPositions: 1,
    salesOwnerId:
      user?.role === 'SALES'
        ? user.id
        : (masters.data?.salesUsers[0]?.id ?? user?.id ?? ''),
    priorityCode: masters.data?.priorities[0]?.code ?? '',
    taOwnerId: '',
    taHandoffDate: '',
    targetClosureDate: '',
    remarks: '',
    experience: '',
    jobLocation: '',
    minBudget: '',
    maxBudget: '',
    durationMonths: '',
  };

  return (
    <PageFade>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Requirement Intake
          </h1>
          <p className="text-sm text-muted-foreground">
            Sales owns demand intake. Age, SLA, open/closed positions, and
            closure status are calculated automatically.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : 'New requirement'}
          </Button>
        )}
      </div>

      {masters.data && (
        <RequirementFilterBar
          value={filters}
          onChange={setFilters}
          clients={masters.data.clients}
          families={masters.data.families}
          priorities={masters.data.priorities}
          salesUsers={masters.data.salesUsers}
          taUsers={masters.data.taUsers}
        />
      )}

      {showForm && (
        <div className="mb-6">
          {!masters.data ? (
            <Skeleton className="h-40" />
          ) : masters.isError ? (
            <p className="text-sm text-destructive">Failed to load masters</p>
          ) : (
            <RequirementForm
              masters={masters.data}
              defaultValues={defaultFormValues}
              submitLabel="Create requirement"
              isPending={create.isPending}
              showSalesOwner={user?.role === 'ADMIN'}
              onCancel={() => setShowForm(false)}
              onSubmit={(values) =>
                create.mutate(toCreateBody(values, user?.id))
              }
            />
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
            Create a requirement with core fields; assign TA and handoff later.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Req Id</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Client Name</th>
                  <th className="px-3 py-2 font-medium">Role/Skill</th>
                  <th className="px-3 py-2 font-medium">Priority</th>
                  <th className="px-3 py-2 font-medium">Positions</th>
                  <th className="px-3 py-2 font-medium">Open</th>
                  <th className="px-3 py-2 font-medium">Closed</th>
                  <th className="px-3 py-2 font-medium">Age</th>
                  <th className="px-3 py-2 font-medium">TA Handoff SLA</th>
                  <th className="px-3 py-2 font-medium">Req Status</th>
                  <th className="px-3 py-2 font-medium">Closure Status</th>
                </tr>
              </thead>
              <tbody>
                {list.data.items.map((r, i) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.015 }}
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
                    <td className="px-3 py-2 tabular-nums">
                      {String(r.requirementDate).slice(0, 10)}
                    </td>
                    <td className="px-3 py-2">{r.client?.name ?? '—'}</td>
                    <td className="px-3 py-2">{r.roleSkill}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {r.priorityCode}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {r.numberOfPositions}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{r.openPositions}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {r.closedPositions}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {r.requirementAgeDays}d
                    </td>
                    <td className="px-3 py-2">
                      <RagChip rag={r.taHandoffSlaRag} />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{r.status}</td>
                    <td className="px-3 py-2">
                      <ClosureStatusChip status={r.closureStatus} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {list.data.total} result{list.data.total === 1 ? '' : 's'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={(filters.page ?? 1) <= 1}
                onClick={() =>
                  setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))
                }
              >
                Previous
              </Button>
              <span>
                Page {filters.page ?? 1} / {totalPages || 1}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={(filters.page ?? 1) >= totalPages}
                onClick={() =>
                  setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </PageFade>
  );
}
