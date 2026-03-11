'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/toast/toast-provider';
import { adminApi } from '@/lib/api/endpoints';

export function EditCourseClient({ id }: { id: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const course = useQuery({ queryKey: ['admin', 'courses', id], queryFn: () => adminApi.courses.get(id) });
  const skills = useQuery({ queryKey: ['admin', 'skills'], queryFn: adminApi.skills.list });
  const modules = useQuery({
    enabled: Boolean(course.data?.id),
    queryKey: ['admin', 'courses', id, 'modules'],
    queryFn: () => adminApi.courses.modules(id),
  });

  const [form, setForm] = React.useState<any>(null);

  React.useEffect(() => {
    if (!course.data) return;
    setForm({
      title: course.data.title,
      slug: course.data.slug,
      description: course.data.description ?? '',
      coverImageUrl: course.data.coverImageUrl ?? '',
      difficulty: course.data.difficulty,
      estimatedMinutes: course.data.estimatedMinutes ?? '',
      tags: (course.data.tags ?? []).join(', '),
      status: course.data.status,
      skillIds: (course.data.skills ?? []).map((s: any) => s.skill.id),
    });
  }, [course.data]);

  const save = useMutation({
    mutationFn: async () =>
      adminApi.courses.update(id, {
        ...form,
        estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : undefined,
        tags: String(form.tags || '')
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'courses', id] });
      await qc.invalidateQueries({ queryKey: ['admin', 'courses'] });
      toast({ title: 'Course saved', description: 'Your changes were applied.' });
    },
    onError: (e) =>
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const createModule = useMutation({
    mutationFn: async (title: string) =>
      adminApi.courses.createModule(id, { title, status: 'draft' }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'courses', id, 'modules'] });
    },
  });

  if (course.isLoading || !form) {
    return (
      <main className="container py-10">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </main>
    );
  }
  if (course.isError) {
    return (
      <main className="container py-10">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm font-medium">Couldn’t load course</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {course.error instanceof Error ? course.error.message : 'Unknown error'}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit course</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{id}</span>
          </div>
        </div>
        <div className="flex gap-2 text-sm">
          <Link className="rounded-md border px-3 py-2 hover:bg-muted" href="/admin/courses">
            Back
          </Link>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            >
              <option value="beginner">beginner</option>
              <option value="intermediate">intermediate</option>
              <option value="advanced">advanced</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Estimated minutes</Label>
            <Input
              value={form.estimatedMinutes}
              onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Tags (comma-separated)</Label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Skills</Label>
            {skills.isLoading ? (
              <div className="text-sm text-muted-foreground">Loading skills…</div>
            ) : skills.isError ? (
              <div className="text-sm text-muted-foreground">
                {skills.error instanceof Error ? skills.error.message : 'Failed to load skills'}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(skills.data ?? []).map((s) => {
                  const checked = form.skillIds.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setForm((f: any) => ({
                            ...f,
                            skillIds: checked ? f.skillIds.filter((x: string) => x !== s.id) : [...f.skillIds, s.id],
                          }))
                        }
                      />
                      <span>{s.title}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {save.isError ? (
          <div className="mt-3 rounded-md border bg-muted p-3 text-sm">
            {save.error instanceof Error ? save.error.message : 'Save failed'}
          </div>
        ) : null}
      </div>

      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">Modules</div>
          <CreateInline
            label="New module"
            onCreate={(t) => createModule.mutate(t)}
            disabled={createModule.isPending}
          />
        </div>
        {modules.isLoading ? (
          <div className="mt-3 text-sm text-muted-foreground">Loading modules…</div>
        ) : modules.isError ? (
          <div className="mt-3 text-sm text-muted-foreground">
            {modules.error instanceof Error ? modules.error.message : 'Failed to load modules'}
          </div>
        ) : (modules.data?.length ?? 0) === 0 ? (
          <div className="mt-3 text-sm text-muted-foreground">No modules yet.</div>
        ) : (
          <div className="mt-4 space-y-2">
            {modules.data!.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">{m.title}</div>
                  <div className="text-xs text-muted-foreground">
                    status: {m.status} • order: {m.order}
                  </div>
                </div>
                <Link className="rounded-md border px-3 py-2 text-xs hover:bg-muted" href={`/admin/modules/${m.id}/edit`}>
                  Edit module
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function CreateInline({
  label,
  onCreate,
  disabled,
}: {
  label: string;
  onCreate: (title: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  return open ? (
    <div className="flex items-center gap-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={label} />
      <Button
        size="sm"
        onClick={() => {
          onCreate(title);
          setTitle('');
          setOpen(false);
        }}
        disabled={disabled || !title.trim()}
      >
        Create
      </Button>
      <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  ) : (
    <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
      {label}
    </Button>
  );
}

