'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminApi } from '@/lib/api/endpoints';

export default function AdminSkillsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin', 'skills'], queryFn: adminApi.skills.list });

  const [title, setTitle] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [status, setStatus] = React.useState<'draft' | 'published' | 'archived'>('draft');

  const create = useMutation({
    mutationFn: () => adminApi.skills.create({ title, slug, description, status }),
    onSuccess: async () => {
      setTitle('');
      setSlug('');
      setDescription('');
      setStatus('draft');
      await qc.invalidateQueries({ queryKey: ['admin', 'skills'] });
    },
  });

  const update = useMutation({
    mutationFn: (input: { id: string; patch: any }) => adminApi.skills.update(input.id, input.patch),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['admin', 'skills'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.skills.remove(id),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['admin', 'skills'] }),
  });

  return (
    <main className="container py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Manage skills</h1>
      <p className="mt-2 text-muted-foreground">Create, publish, and organize skill categories.</p>

      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="text-sm font-medium">Create skill</div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Excel Basics" />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="excel-basics" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || !title.trim() || !slug.trim()}
            >
              {create.isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
        {create.isError ? (
          <div className="mt-3 rounded-md border bg-muted p-3 text-sm">
            {create.error instanceof Error ? create.error.message : 'Create failed'}
          </div>
        ) : null}
      </div>

      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="text-sm font-medium">Skills</div>

        {q.isLoading ? (
          <div className="mt-4 text-sm text-muted-foreground">Loading…</div>
        ) : q.isError ? (
          <div className="mt-4 text-sm text-muted-foreground">
            {q.error instanceof Error ? q.error.message : 'Failed to load'}
          </div>
        ) : (q.data?.length ?? 0) === 0 ? (
          <div className="mt-4 text-sm text-muted-foreground">No skills.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-2">Title</th>
                  <th className="py-2">Slug</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(q.data ?? []).map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="py-2 pr-3">
                      <Input
                        defaultValue={s.title}
                        onBlur={(e) =>
                          e.target.value !== s.title &&
                          update.mutate({ id: s.id, patch: { title: e.target.value } })
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <Input
                        defaultValue={s.slug}
                        onBlur={(e) =>
                          e.target.value !== s.slug &&
                          update.mutate({ id: s.id, patch: { slug: e.target.value } })
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        defaultValue={s.status}
                        onChange={(e) => update.mutate({ id: s.id, patch: { status: e.target.value } })}
                      >
                        <option value="draft">draft</option>
                        <option value="published">published</option>
                        <option value="archived">archived</option>
                      </select>
                    </td>
                    <td className="py-2">
                      <Button
                        variant="outline"
                        onClick={() => remove.mutate(s.id)}
                        disabled={remove.isPending}
                      >
                        Archive
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

