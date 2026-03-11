'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api/endpoints';

export default function AdminUsersPage() {
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const q = useQuery({
    queryKey: ['admin', 'users', page, pageSize],
    queryFn: () => adminApi.users(page, pageSize),
  });
  const total = q.data?.total ?? 0;

  return (
    <main className="container py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
      <p className="mt-2 text-muted-foreground">User list and basic account info.</p>

      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">Users</div>
          <div className="flex items-center gap-2 text-sm">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Prev
            </Button>
            <span className="text-xs text-muted-foreground">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * pageSize >= total}
            >
              Next
            </Button>
          </div>
        </div>

        {q.isLoading ? (
          <div className="mt-4 text-sm text-muted-foreground">Loading…</div>
        ) : q.isError ? (
          <div className="mt-4 text-sm text-muted-foreground">
            {q.error instanceof Error ? q.error.message : 'Failed to load'}
          </div>
        ) : !q.data ? (
          <div className="mt-4 text-sm text-muted-foreground">No users.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-2">Email</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Roles</th>
                  <th className="py-2">XP</th>
                  <th className="py-2">Level</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {q.data.items.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="py-2 pr-3">{u.email}</td>
                    <td className="py-2 pr-3">{u.profile?.fullName ?? '—'}</td>
                    <td className="py-2 pr-3">
                      <span className="font-mono text-xs">{u.roles.join(', ')}</span>
                    </td>
                    <td className="py-2 pr-3">{u.profile?.xp ?? 0}</td>
                    <td className="py-2 pr-3">{u.profile?.level ?? 1}</td>
                    <td className="py-2 pr-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-xs text-muted-foreground">
              Total: {q.data.total} • Page size: {q.data.pageSize}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

