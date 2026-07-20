import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import type { RequirementListParams } from '../api/requirements.types';
import type { DirectoryUser } from '../api/requirements.types';

type Props = {
  value: RequirementListParams;
  onChange: (next: RequirementListParams) => void;
  clients: { id: string; name: string }[];
  families: { id: string; name: string }[];
  priorities: { code: string; label: string }[];
  salesUsers: DirectoryUser[];
  taUsers: DirectoryUser[];
};

export function RequirementFilterBar({
  value,
  onChange,
  clients,
  families,
  priorities,
  salesUsers,
  taUsers,
}: Props) {
  const set = (patch: Partial<RequirementListParams>) =>
    onChange({ ...value, ...patch, page: 1 });

  return (
    <div className="mb-4 grid gap-3 rounded-md border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      <div className="space-y-1 sm:col-span-2">
        <Label>Search</Label>
        <Input
          placeholder="Req ID, role, client, owner…"
          value={value.q ?? ''}
          onChange={(e) => set({ q: e.target.value || undefined })}
        />
      </div>
      <div className="space-y-1">
        <Label>Status</Label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
          value={value.status ?? ''}
          onChange={(e) => set({ status: e.target.value || undefined })}
        >
          <option value="">All</option>
          {['ACTIVE', 'ON_HOLD', 'CANCELLED', 'CLOSED'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label>Priority</Label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
          value={value.priorityCode ?? ''}
          onChange={(e) => set({ priorityCode: e.target.value || undefined })}
        >
          <option value="">All</option>
          {priorities.map((p) => (
            <option key={p.code} value={p.code}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label>Client</Label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
          value={value.clientId ?? ''}
          onChange={(e) => set({ clientId: e.target.value || undefined })}
        >
          <option value="">All</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label>Job Family</Label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
          value={value.jobFamilyId ?? ''}
          onChange={(e) => set({ jobFamilyId: e.target.value || undefined })}
        >
          <option value="">All</option>
          {families.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label>Sales Owner</Label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
          value={value.salesOwnerId ?? ''}
          onChange={(e) => set({ salesOwnerId: e.target.value || undefined })}
        >
          <option value="">All</option>
          {salesUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label>TA Owner</Label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
          value={value.taOwnerId ?? ''}
          onChange={(e) => set({ taOwnerId: e.target.value || undefined })}
        >
          <option value="">All</option>
          {taUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label>From</Label>
        <Input
          type="date"
          value={value.from ?? ''}
          onChange={(e) => set({ from: e.target.value || undefined })}
        />
      </div>
      <div className="space-y-1">
        <Label>To</Label>
        <Input
          type="date"
          value={value.to ?? ''}
          onChange={(e) => set({ to: e.target.value || undefined })}
        />
      </div>
      <div className="space-y-1">
        <Label>Sort</Label>
        <select
          className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
          value={value.sort ?? 'requirementDate:desc'}
          onChange={(e) => set({ sort: e.target.value || undefined })}
        >
          <option value="requirementDate:desc">Date ↓</option>
          <option value="requirementDate:asc">Date ↑</option>
          <option value="priorityCode:asc">Priority</option>
          <option value="status:asc">Status</option>
          <option value="publicId:asc">Req ID</option>
        </select>
      </div>
    </div>
  );
}
