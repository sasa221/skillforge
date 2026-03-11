'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/toast/toast-provider';
import { adminApi } from '@/lib/api/endpoints';

function prettyJson(v: any) {
  return JSON.stringify(v, null, 2);
}

export function EditLessonClient({ id }: { id: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const q = useQuery({ queryKey: ['admin', 'lessons', id], queryFn: () => adminApi.lessons.get(id) });

  const [form, setForm] = React.useState<any>(null);
  const [blocksText, setBlocksText] = React.useState<string>('');

  React.useEffect(() => {
    if (!q.data) return;
    setForm({
      title: q.data.title,
      slug: q.data.slug,
      learningObjective: q.data.learningObjective ?? '',
      estimatedMinutes: q.data.estimatedMinutes ?? 10,
      order: q.data.order ?? 0,
      status: q.data.status,
      aiPromptSeed: q.data.aiPromptSeed ?? '',
    });
    setBlocksText(
      prettyJson(
        (q.data.blocks ?? []).map((b) => ({
          type: b.type,
          content: b.content,
        })),
      ),
    );
  }, [q.data]);

  const save = useMutation({
    mutationFn: async () => {
      let blocks: Array<{ type: string; order: number; content: any }> | undefined;
      try {
        const parsed = JSON.parse(blocksText) as Array<{ type: string; content: any }>;
        blocks = parsed.map((b, idx) => ({ type: b.type, order: idx, content: b.content }));
      } catch {
        throw new Error('Blocks JSON is invalid');
      }
      return adminApi.lessons.update(id, {
        ...form,
        estimatedMinutes: Number(form.estimatedMinutes),
        order: Number(form.order),
        learningObjective: form.learningObjective || undefined,
        aiPromptSeed: form.aiPromptSeed || undefined,
        blocks,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'lessons', id] });
      toast({ title: 'Lesson saved', description: 'Your changes were applied.' });
    },
    onError: (e) =>
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const upsertQuiz = useMutation({
    mutationFn: async () => adminApi.lessons.upsertQuiz(id, { passingScore: 70, status: 'draft' }),
    onSuccess: async (quiz) => {
      await qc.invalidateQueries({ queryKey: ['admin', 'lessons', id] });
      window.location.href = `/admin/quizzes/${quiz.id}/edit`;
    },
  });

  if (q.isLoading || !form) {
    return (
      <main className="container py-10">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </main>
    );
  }
  if (q.isError) {
    return (
      <main className="container py-10">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm font-medium">Couldn’t load lesson</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {q.error instanceof Error ? q.error.message : 'Unknown error'}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit lesson</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{id}</span>
          </div>
        </div>
        <div className="flex gap-2 text-sm">
          <Link className="rounded-md border px-3 py-2 hover:bg-muted" href={`/admin/modules/${q.data!.moduleId}/edit`}>
            Back to module
          </Link>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-2">
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
              <Label>Objective</Label>
              <Input
                value={form.learningObjective}
                onChange={(e) => setForm({ ...form, learningObjective: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Estimated minutes</Label>
              <Input
                value={String(form.estimatedMinutes)}
                onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input value={String(form.order)} onChange={(e) => setForm({ ...form, order: e.target.value })} />
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
            <div className="space-y-2 md:col-span-2">
              <Label>AI prompt seed</Label>
              <Input value={form.aiPromptSeed} onChange={(e) => setForm({ ...form, aiPromptSeed: e.target.value })} />
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <Label>Lesson blocks (JSON array)</Label>
            <textarea
              className="h-80 w-full rounded-xl border bg-background p-3 font-mono text-xs"
              value={blocksText}
              onChange={(e) => setBlocksText(e.target.value)}
            />
            <div className="text-xs text-muted-foreground">
              Format: <span className="font-mono">[{`{ type, content }`}]</span> where <span className="font-mono">content</span> is arbitrary JSON.
            </div>
          </div>

          {save.isError ? (
            <div className="mt-3 rounded-md border bg-muted p-3 text-sm">
              {save.error instanceof Error ? save.error.message : 'Save failed'}
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="text-sm font-medium">Quiz</div>
            {q.data!.quiz ? (
              <div className="mt-3 space-y-2">
                <div className="text-sm text-muted-foreground">
                  Status: <span className="font-mono">{q.data!.quiz.status}</span>
                </div>
                <Link
                  className="inline-block rounded-md border px-3 py-2 text-sm hover:bg-muted"
                  href={`/admin/quizzes/${q.data!.quiz.id}/edit`}
                >
                  Edit quiz
                </Link>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <div className="text-sm text-muted-foreground">No quiz yet.</div>
                <Button onClick={() => upsertQuiz.mutate()} disabled={upsertQuiz.isPending}>
                  {upsertQuiz.isPending ? 'Creating…' : 'Create quiz'}
                </Button>
                {upsertQuiz.isError ? (
                  <div className="rounded-md border bg-muted p-3 text-sm">
                    {upsertQuiz.error instanceof Error ? upsertQuiz.error.message : 'Failed'}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

