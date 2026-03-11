'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/toast/toast-provider';
import { adminApi } from '@/lib/api/endpoints';

export function EditQuizClient({ id }: { id: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const q = useQuery({ queryKey: ['admin', 'quizzes', id], queryFn: () => adminApi.quizzes.get(id) });

  const [title, setTitle] = React.useState('');
  const [passingScore, setPassingScore] = React.useState('70');
  const [status, setStatus] = React.useState<'draft' | 'published' | 'archived'>('draft');

  React.useEffect(() => {
    if (!q.data) return;
    setTitle(q.data.title ?? '');
    setPassingScore(String(q.data.passingScore));
    setStatus(q.data.status as any);
  }, [q.data]);

  const save = useMutation({
    mutationFn: async () =>
      adminApi.quizzes.update(id, {
        title: title || undefined,
        passingScore: Number(passingScore),
        status,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'quizzes', id] });
      toast({ title: 'Quiz saved', description: 'Your changes were applied.' });
    },
    onError: (e) =>
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const [newPrompt, setNewPrompt] = React.useState('');
  const [newType, setNewType] = React.useState<'multiple_choice' | 'true_false'>('multiple_choice');
  const [newExplanation, setNewExplanation] = React.useState('');
  const [newOptions, setNewOptions] = React.useState('["Option A","Option B"]');
  const [newCorrectIndex, setNewCorrectIndex] = React.useState('0');

  const createQuestion = useMutation({
    mutationFn: async () => {
      let opts: string[] = [];
      try {
        opts = JSON.parse(newOptions);
      } catch {
        throw new Error('Options JSON must be an array of strings');
      }
      return adminApi.quizzes.createQuestion(id, {
        type: newType,
        prompt: newPrompt,
        explanation: newExplanation || undefined,
        options: opts.map((t, idx) => ({ text: t, order: idx })),
        correctOptionIndex: Number(newCorrectIndex),
        difficulty: 1,
        order: (q.data?.questions?.length ?? 0),
      });
    },
    onSuccess: async () => {
      setNewPrompt('');
      setNewExplanation('');
      setNewOptions('["Option A","Option B"]');
      setNewCorrectIndex('0');
      await qc.invalidateQueries({ queryKey: ['admin', 'quizzes', id] });
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: (qid: string) => adminApi.questions.remove(qid),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['admin', 'quizzes', id] }),
  });

  if (q.isLoading) {
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
          <div className="text-sm font-medium">Couldn’t load quiz</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {q.error instanceof Error ? q.error.message : 'Unknown error'}
          </div>
        </div>
      </main>
    );
  }

  const quiz = q.data!;

  return (
    <main className="container py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit quiz</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{id}</span>
          </div>
          {quiz.lesson ? (
            <div className="mt-1 text-sm text-muted-foreground">
              Lesson: <span className="font-medium">{quiz.lesson.title}</span>
            </div>
          ) : null}
        </div>
        <div className="flex gap-2 text-sm">
          {quiz.lesson ? (
            <Link className="rounded-md border px-3 py-2 hover:bg-muted" href={`/admin/lessons/${quiz.lesson.id}/edit`}>
              Back to lesson
            </Link>
          ) : null}
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional" />
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
          <div className="space-y-2">
            <Label>Passing score (%)</Label>
            <Input value={passingScore} onChange={(e) => setPassingScore(e.target.value)} />
          </div>
        </div>
        {save.isError ? (
          <div className="mt-3 rounded-md border bg-muted p-3 text-sm">
            {save.error instanceof Error ? save.error.message : 'Save failed'}
          </div>
        ) : null}
      </div>

      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="text-sm font-medium">Questions</div>
        {(quiz.questions?.length ?? 0) === 0 ? (
          <div className="mt-3 text-sm text-muted-foreground">No questions yet.</div>
        ) : (
          <div className="mt-4 space-y-3">
            {quiz.questions!.map((qq) => (
              <div key={qq.id} className="rounded-xl border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{qq.prompt}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {qq.type} • difficulty {qq.difficulty} • order {qq.order}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteQuestion.mutate(qq.id)}
                    disabled={deleteQuestion.isPending}
                  >
                    Delete
                  </Button>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  {qq.options.map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-3">
                      <span>{o.text}</span>
                      <span className="text-xs text-muted-foreground">
                        {qq.correctOptionId === o.id ? 'correct' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-xl border bg-background p-4">
          <div className="text-sm font-medium">Add question</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Prompt</Label>
              <Input value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
              >
                <option value="multiple_choice">multiple_choice</option>
                <option value="true_false">true_false</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Correct option index</Label>
              <Input value={newCorrectIndex} onChange={(e) => setNewCorrectIndex(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Options JSON (array of strings)</Label>
              <Input value={newOptions} onChange={(e) => setNewOptions(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Explanation (optional)</Label>
              <Input value={newExplanation} onChange={(e) => setNewExplanation(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => createQuestion.mutate()}
                disabled={createQuestion.isPending || !newPrompt.trim()}
              >
                {createQuestion.isPending ? 'Creating…' : 'Add question'}
              </Button>
            </div>
          </div>
          {createQuestion.isError ? (
            <div className="mt-3 rounded-md border bg-muted p-3 text-sm">
              {createQuestion.error instanceof Error ? createQuestion.error.message : 'Failed'}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

