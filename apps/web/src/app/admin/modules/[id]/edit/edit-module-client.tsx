'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/toast/toast-provider';
import { adminApi } from '@/lib/api/endpoints';

export function EditModuleClient({ id }: { id: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const mod = useQuery({ queryKey: ['admin', 'modules', id], queryFn: () => adminApi.modules.get(id) });
  const lessons = useQuery({
    enabled: Boolean(mod.data?.id),
    queryKey: ['admin', 'modules', id, 'lessons'],
    queryFn: () => adminApi.modules.lessons(id),
  });

  const [form, setForm] = React.useState<any>(null);
  React.useEffect(() => {
    if (!mod.data) return;
    setForm({
      title: mod.data.title,
      description: mod.data.description ?? '',
      order: String(mod.data.order ?? 0),
      status: mod.data.status,
    });
  }, [mod.data]);

  const save = useMutation({
    mutationFn: async () =>
      adminApi.modules.update(id, {
        title: form.title,
        description: form.description,
        order: Number(form.order),
        status: form.status,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'modules', id] });
      await qc.invalidateQueries({ queryKey: ['admin', 'courses'] });
      toast({ title: 'Module saved', description: 'Your changes were applied.' });
    },
    onError: (e) =>
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const createLesson = useMutation({
    mutationFn: async (input: { title: string; slug: string }) =>
      adminApi.modules.createLesson(id, { ...input, status: 'draft' }),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['admin', 'modules', id, 'lessons'] }),
  });

  if (mod.isLoading || !form) {
    return (
      <main className="container py-10">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </main>
    );
  }
  if (mod.isError) {
    return (
      <main className="container py-10">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm font-medium">Couldn’t load module</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {mod.error instanceof Error ? mod.error.message : 'Unknown error'}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit module</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{id}</span>
          </div>
        </div>
        <div className="flex gap-2 text-sm">
          <Link className="rounded-md border px-3 py-2 hover:bg-muted" href={`/admin/courses/${mod.data!.courseId}/edit`}>
            Back to course
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
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Order</Label>
            <Input value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
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
        </div>
        {save.isError ? (
          <div className="mt-3 rounded-md border bg-muted p-3 text-sm">
            {save.error instanceof Error ? save.error.message : 'Save failed'}
          </div>
        ) : null}
      </div>

      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">Lessons</div>
          <CreateLessonInline onCreate={(t, s) => createLesson.mutate({ title: t, slug: s })} disabled={createLesson.isPending} />
        </div>

        {lessons.isLoading ? (
          <div className="mt-3 text-sm text-muted-foreground">Loading lessons…</div>
        ) : lessons.isError ? (
          <div className="mt-3 text-sm text-muted-foreground">
            {lessons.error instanceof Error ? lessons.error.message : 'Failed to load lessons'}
          </div>
        ) : (lessons.data?.length ?? 0) === 0 ? (
          <div className="mt-3 text-sm text-muted-foreground">No lessons yet.</div>
        ) : (
          <div className="mt-4 space-y-2">
            {lessons.data!.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">{l.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.slug} • status: {l.status} • order: {l.order}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link className="rounded-md border px-3 py-2 text-xs hover:bg-muted" href={`/admin/lessons/${l.id}/edit`}>
                    Edit
                  </Link>
                  {l.quiz ? (
                    <Link className="rounded-md border px-3 py-2 text-xs hover:bg-muted" href={`/admin/quizzes/${l.quiz.id}/edit`}>
                      Quiz
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function CreateLessonInline({
  onCreate,
  disabled,
}: {
  onCreate: (title: string, slug: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [slug, setSlug] = React.useState('');
  return open ? (
    <div className="flex flex-wrap items-center gap-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lesson title" />
      <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="lesson-slug" />
      <Button
        size="sm"
        onClick={() => {
          onCreate(title, slug);
          setTitle('');
          setSlug('');
          setOpen(false);
        }}
        disabled={disabled || !title.trim() || !slug.trim()}
      >
        Create
      </Button>
      <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  ) : (
    <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
      New lesson
    </Button>
  );
}

