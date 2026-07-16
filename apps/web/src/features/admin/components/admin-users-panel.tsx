import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import api from '@/shared/lib/api';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { useAuth } from '@/features/auth/auth-context';

const ASSIGNABLE_ROLES = [
  'SALES',
  'TA',
  'HR',
  'LEADERSHIP_READONLY',
  'ADMIN',
] as const;

type UserRow = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

type EditState = {
  id: string;
  fullName: string;
  role: string;
  isActive: boolean;
  newPassword: string;
};

export function AdminUsersPanel() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [editing, setEditing] = useState<EditState | null>(null);

  const users = useQuery({
    queryKey: ['users', roleFilter],
    queryFn: async () =>
      (
        await api.get('/users', {
          params: {
            pageSize: 100,
            role: roleFilter === 'ALL' ? undefined : roleFilter,
          },
        })
      ).data as { items: UserRow[]; total: number },
  });

  const createUser = useMutation({
    mutationFn: async (body: Record<string, string>) =>
      (await api.post('/users', body)).data,
    onSuccess: (_data, vars) => {
      toast.success(
        `${vars.fullName} created as ${vars.role}. They can sign in with the email and password you set.`,
      );
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => toast.error('Could not create user (email may already exist)'),
  });

  const updateUser = useMutation({
    mutationFn: async (body: {
      id: string;
      fullName: string;
      role: string;
      isActive: boolean;
      newPassword?: string;
    }) => {
      await api.patch(`/users/${body.id}`, {
        fullName: body.fullName,
        role: body.role,
        isActive: body.isActive,
      });
      if (body.newPassword && body.newPassword.length >= 8) {
        await api.post(`/users/${body.id}/reset-password`, {
          password: body.newPassword,
        });
      }
    },
    onSuccess: () => {
      toast.success('User updated');
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => toast.error('Update failed'),
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/users/${id}`)).data,
    onSuccess: () => {
      toast.success('User deleted');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => toast.error('Delete failed'),
  });

  const roleCounts = useMemo(() => {
    const items = users.data?.items ?? [];
    const counts: Record<string, number> = { ALL: users.data?.total ?? items.length };
    for (const r of ASSIGNABLE_ROLES) {
      counts[r] = items.filter((u) => u.role === r).length;
    }
    return counts;
  }, [users.data]);

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Add user by role</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Create HR, TA, Sales (and other) accounts. They sign in with the email
          and temporary password you provide here.
        </p>
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            createUser.mutate({
              email: String(fd.get('email')),
              fullName: String(fd.get('fullName')),
              role: String(fd.get('role')),
              password: String(fd.get('password')),
            });
            e.currentTarget.reset();
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" required placeholder="Jane Doe" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Login email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="jane@company.com"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
              defaultValue="TA"
              required
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Temporary password</Label>
            <Input
              id="password"
              name="password"
              type="text"
              required
              minLength={8}
              placeholder="Min 8 characters"
              autoComplete="new-password"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={createUser.isPending}>
              Add user
            </Button>
          </div>
        </form>
      </div>

      <div className="flex flex-wrap gap-1">
        {(['ALL', ...ASSIGNABLE_ROLES] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRoleFilter(r)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              roleFilter === r
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {r === 'ALL' ? 'All' : r.replace(/_/g, ' ')}
            {roleFilter === 'ALL' && r !== 'ALL'
              ? ''
              : roleFilter === r && users.data
                ? ` (${r === 'ALL' ? users.data.total : roleCounts[r] ?? 0})`
                : ''}
          </button>
        ))}
      </div>

      {users.isLoading ? (
        <Skeleton className="h-40" />
      ) : !users.data?.items?.length ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No users in this role yet. Add one above.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.data.items.map((u) => (
                <tr key={u.id} className="border-t border-border/70 align-top">
                  {editing?.id === u.id ? (
                    <>
                      <td className="px-3 py-2" colSpan={5}>
                        <div className="grid gap-3 rounded-md border border-border bg-muted/30 p-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="space-y-1">
                            <Label>Full name</Label>
                            <Input
                              value={editing.fullName}
                              onChange={(e) =>
                                setEditing({ ...editing, fullName: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Role</Label>
                            <select
                              className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                              value={editing.role}
                              onChange={(e) =>
                                setEditing({ ...editing, role: e.target.value })
                              }
                            >
                              {ASSIGNABLE_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label>Active</Label>
                            <select
                              className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                              value={editing.isActive ? 'true' : 'false'}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  isActive: e.target.value === 'true',
                                })
                              }
                            >
                              <option value="true">Active (can login)</option>
                              <option value="false">Inactive (blocked)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label>New password (optional)</Label>
                            <Input
                              type="text"
                              minLength={8}
                              placeholder="Leave blank to keep"
                              value={editing.newPassword}
                              onChange={(e) =>
                                setEditing({
                                  ...editing,
                                  newPassword: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
                            <Button
                              size="sm"
                              disabled={updateUser.isPending}
                              onClick={() =>
                                updateUser.mutate({
                                  id: editing.id,
                                  fullName: editing.fullName,
                                  role: editing.role,
                                  isActive: editing.isActive,
                                  newPassword: editing.newPassword || undefined,
                                })
                              }
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditing(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 font-medium">{u.fullName}</td>
                      <td className="px-3 py-2">{u.email}</td>
                      <td className="px-3 py-2">
                        <Badge variant="muted">{u.role.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        {u.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setEditing({
                                id: u.id,
                                fullName: u.fullName,
                                role: u.role,
                                isActive: u.isActive,
                                newPassword: '',
                              })
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={u.id === me?.id || deleteUser.isPending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete ${u.fullName} (${u.role})? They will no longer be able to log in.`,
                                )
                              ) {
                                deleteUser.mutate(u.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
