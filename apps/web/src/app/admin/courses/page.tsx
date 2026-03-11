'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api/endpoints';

export default function AdminCoursesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin', 'courses'], queryFn: adminApi.courses.list });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.courses.remove(id),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['admin', 'courses'] }),
  });

  return (
    <main className="container py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage courses</h1>
          <p className="mt-2 text-muted-foreground">Create courses and manage publishing and structure.</p>
        </div>
        <Link
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
          href="/admin/courses/new"
        >
          New course
        </Link>
      </div>

      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="text-sm font-medium">Courses</div>
        {q.isLoading ? (
          <div className="mt-4 text-sm text-muted-foreground">Loading…</div>
        ) : q.isError ? (
          <div className="mt-4 text-sm text-muted-foreground">
            {q.error instanceof Error ? q.error.message : 'Failed to load'}
          </div>
        ) : (q.data?.length ?? 0) === 0 ? (
          <div className="mt-4 text-sm text-muted-foreground">No courses.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-2">Title</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Difficulty</th>
                  <th className="py-2">Modules</th>
                  <th className="py-2">Lessons</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(q.data ?? []).map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{c.title}</div>
                      <div className="text-xs text-muted-foreground">{c.slug}</div>
                    </td>
                    <td className="py-2 pr-3">
                      <span className="rounded-full border bg-background px-2 py-0.5 text-xs">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{c.difficulty}</td>
                    <td className="py-2 pr-3">{c.moduleCount}</td>
                    <td className="py-2 pr-3">{c.lessonCount}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className="rounded-md border px-3 py-2 text-xs hover:bg-muted"
                          href={`/admin/courses/${c.id}/edit`}
                        >
                          Edit
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => remove.mutate(c.id)}
                          disabled={remove.isPending}
                        >
                          Archive
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {remove.isError ? (
              <div className="mt-3 rounded-md border bg-muted p-3 text-sm">
                {remove.error instanceof Error ? remove.error.message : 'Delete failed'}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}

