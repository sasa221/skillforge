'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { eventsApi, lessonsApi, progressApi, quizzesApi } from '@/lib/api/endpoints';
import type { LessonBlock, LessonQuizResponse, QuizSubmitResult, SubmitQuizAnswer } from '@/lib/content/types';
import { aiApi } from '@/lib/api/endpoints';
import { useToast } from '@/components/toast/toast-provider';
import { AiTeacherPanel } from './AiTeacherPanel';

function BlockRenderer({ block }: { block: LessonBlock }) {
  const c: any = block.content ?? {};
  switch (block.type) {
    case 'heading':
      return <h2 className="mt-8 text-xl font-semibold tracking-tight">{c.text ?? ''}</h2>;
    case 'paragraph':
      return <p className="mt-3 leading-7 text-muted-foreground">{c.text ?? ''}</p>;
    case 'bullet_list':
      return (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
          {(c.bullets ?? []).map((b: string, i: number) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      );
    case 'code_block':
      return (
        <pre className="mt-4 overflow-x-auto rounded-xl border bg-muted p-4 text-sm">
          <code>{c.code ?? ''}</code>
        </pre>
      );
    case 'callout':
      return (
        <div className="mt-4 rounded-xl border bg-card p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {c.variant ?? 'note'}
          </div>
          <div className="mt-2 text-sm">{c.text ?? ''}</div>
        </div>
      );
    case 'example':
      return (
        <div className="mt-4 rounded-xl border bg-card p-4">
          <div className="text-sm font-medium">{c.title ?? 'Example'}</div>
          <div className="mt-2 text-sm text-muted-foreground">{c.text ?? ''}</div>
        </div>
      );
    case 'recap':
      return (
        <div className="mt-6 rounded-xl border bg-card p-4">
          <div className="text-sm font-medium">Recap</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {(c.bullets ?? []).map((b: string, i: number) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      );
    case 'checkpoint_intro':
      return (
        <div className="mt-6 rounded-xl border bg-card p-4">
          <div className="text-sm font-medium">Checkpoint</div>
          <div className="mt-2 text-sm text-muted-foreground">{c.text ?? ''}</div>
        </div>
      );
    case 'image':
      return (
        <div className="mt-4 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          Image block (assets in later phase)
        </div>
      );
    default:
      return (
        <div className="mt-4 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          Unsupported block type: <span className="font-mono">{block.type}</span>
        </div>
      );
  }
}

export function LessonClient({ lessonSlug }: { lessonSlug: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const q = useQuery({
    queryKey: ['lessons', 'bySlug', lessonSlug],
    queryFn: () => lessonsApi.bySlug(lessonSlug),
  });

  const lesson = q.data;
  const L = lesson!;

  React.useEffect(() => {
    if (!lesson?.id) return;
    eventsApi.lessonOpened(lesson.id).catch(() => {});
  }, [lesson?.id]);

  const courseProgress = useQuery({
    enabled: Boolean(lesson?.course?.id),
    queryKey: ['progress', 'course', lesson?.course?.id],
    queryFn: () => progressApi.course(lesson!.course.id),
  });

  const quizQuery = useQuery({
    enabled: Boolean(lesson?.id),
    queryKey: ['quizzes', 'lesson', lesson?.id],
    queryFn: () => quizzesApi.lessonQuiz(lesson!.id),
  });

  const completeMutation = useMutation({
    mutationFn: async () => progressApi.completeLesson(lesson!.id),
    onSuccess: async () => {
      toast({ title: 'Lesson completed', description: 'Progress updated.' });
      await qc.invalidateQueries({ queryKey: ['progress', 'course', lesson?.course?.id] });
      await qc.invalidateQueries({ queryKey: ['progress', 'dashboard'] });
      await qc.invalidateQueries({ queryKey: ['progress', 'profile'] });
    },
    onError: (e) => {
      toast({
        title: 'Couldn’t complete lesson',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = React.useState<QuizSubmitResult | null>(null);
  const [explanations, setExplanations] = React.useState<Record<string, string>>({});

  const explainMutation = useMutation({
    mutationFn: async (input: { questionId: string; selectedOptionId?: string }) => {
      return aiApi.explainAnswer({ lessonId: lesson!.id, questionId: input.questionId, selectedOptionId: input.selectedOptionId });
    },
    onSuccess: (res, vars) => {
      setExplanations((m) => ({ ...m, [vars.questionId]: res.explanation }));
    },
  });

  const submitQuiz = useMutation({
    mutationFn: async () => {
      const quiz = quizQuery.data as LessonQuizResponse;
      if (!quiz || quiz.hasQuiz === false) throw new Error('No quiz');
      const payload: SubmitQuizAnswer[] = quiz.quiz.questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: answers[q.id],
      }));
      return quizzesApi.submitLessonQuiz(lesson!.id, payload);
    },
    onSuccess: async (res) => {
      setQuizResult(res);
      toast({
        title: res.passed ? 'Quiz passed' : 'Quiz submitted',
        description: `Score: ${res.score}%`,
      });
      await qc.invalidateQueries({ queryKey: ['progress', 'course', lesson?.course?.id] });
      await qc.invalidateQueries({ queryKey: ['progress', 'dashboard'] });
      await qc.invalidateQueries({ queryKey: ['progress', 'profile'] });
    },
    onError: (e) => {
      toast({
        title: 'Quiz submission failed',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  if (q.isLoading) {
    return (
      <main className="container py-10">
        <div className="h-7 w-1/2 rounded bg-muted" />
        <div className="mt-4 h-4 w-2/3 rounded bg-muted" />
        <div className="mt-8 h-40 rounded-xl border bg-card p-5 shadow-sm" />
      </main>
    );
  }

  if (q.isError) {
    return (
      <main className="container py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Lesson</h1>
        <div className="mt-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm font-medium">Couldn’t load lesson</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {q.error instanceof Error ? q.error.message : 'Unknown error'}
          </div>
          <div className="mt-4">
            <Link className="rounded-md border px-3 py-2 text-sm hover:bg-muted" href="/dashboard">
              Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const lessonCompleted = Boolean(
    courseProgress.data?.modules
      .flatMap((m) => m.lessons)
      .find((l) => l.id === lesson?.id)?.completed,
  );
  const hasQuiz = quizQuery.data && (quizQuery.data as any).hasQuiz === true;
  const quizPassed = quizResult?.passed ?? false;
  const canMarkComplete = !lessonCompleted && (!hasQuiz || quizPassed);

  return (
    <main className="container py-10">
      <nav className="text-sm text-muted-foreground">
        <Link className="hover:text-foreground" href="/dashboard">
          Dashboard
        </Link>{' '}
        /{' '}
        <Link className="hover:text-foreground" href={`/dashboard/courses/${L.course.slug}`}>
          {L.course.title}
        </Link>{' '}
        / <span className="text-foreground">{L.title}</span>
      </nav>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{L.title}</h1>
      {L.learningObjective ? (
        <p className="mt-2 text-muted-foreground">{L.learningObjective}</p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <article className="lg:col-span-2">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            {L.blocks.length === 0 ? (
              <div className="text-sm text-muted-foreground">No content blocks yet.</div>
            ) : (
              L.blocks.map((b) => <BlockRenderer key={b.id} block={b} />)
            )}

            <div className="mt-10 flex flex-wrap gap-3">
              {L.navigation.prev ? (
                <Link
                  className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
                  href={`/dashboard/lessons/${L.navigation.prev.slug}`}
                >
                  ← Previous
                </Link>
              ) : null}
              {L.navigation.next ? (
                <Link
                  className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
                  href={`/dashboard/lessons/${L.navigation.next.slug}`}
                >
                  Next →
                </Link>
              ) : null}
              <Button
                variant={lessonCompleted ? 'outline' : 'default'}
                disabled={!canMarkComplete || completeMutation.isPending}
                onClick={() => completeMutation.mutate()}
              >
                {lessonCompleted ? 'Completed' : completeMutation.isPending ? 'Completing…' : 'Mark complete'}
              </Button>
            </div>
          </div>
        </article>

        <aside className="space-y-4">
          <AiTeacherPanel lessonId={L.id} />

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="text-sm font-medium">Checkpoint / Quiz</div>
            {quizQuery.isLoading ? (
              <p className="mt-2 text-sm text-muted-foreground">Loading quiz…</p>
            ) : quizQuery.isError ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {quizQuery.error instanceof Error ? quizQuery.error.message : 'Quiz unavailable'}
              </p>
            ) : !quizQuery.data || (quizQuery.data as any).hasQuiz === false ? (
              <p className="mt-2 text-sm text-muted-foreground">No quiz for this lesson.</p>
            ) : (
              <div className="mt-3 space-y-4">
                {(quizQuery.data as any).quiz.questions.map((qq: any) => (
                  <div key={qq.id} className="rounded-xl border bg-background p-4">
                    <div className="text-sm font-medium">{qq.prompt}</div>
                    <div className="mt-3 space-y-2">
                      {qq.options.map((opt: any) => (
                        <label key={opt.id} className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name={qq.id}
                            value={opt.id}
                            checked={answers[qq.id] === opt.id}
                            onChange={() => setAnswers((a) => ({ ...a, [qq.id]: opt.id }))}
                          />
                          <span>{opt.text}</span>
                        </label>
                      ))}
                    </div>

                    {quizResult ? (
                      <div className="mt-3 text-sm">
                        {quizResult.questions.find((r) => r.questionId === qq.id)?.isCorrect ? (
                          <span className="text-muted-foreground">Correct</span>
                        ) : (
                          <div className="text-muted-foreground">
                            Incorrect.
                            {quizResult.questions.find((r) => r.questionId === qq.id)?.explanation ? (
                              <div className="mt-1">
                                Explanation: {quizResult.questions.find((r) => r.questionId === qq.id)?.explanation}
                              </div>
                            ) : null}
                            <div className="mt-2">
                              <button
                                type="button"
                                className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                                onClick={() =>
                                  explainMutation.mutate({
                                    questionId: qq.id,
                                    selectedOptionId: answers[qq.id],
                                  })
                                }
                                disabled={explainMutation.isPending}
                              >
                                {explainMutation.isPending ? 'Explaining…' : 'Explain with AI'}
                              </button>
                            </div>
                            {explanations[qq.id] ? (
                              <div className="mt-2 rounded-md border bg-card p-3 text-sm">
                                {explanations[qq.id]}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}

                {quizResult ? (
                  <div className="rounded-xl border bg-background p-4 text-sm">
                    Score: <span className="font-mono">{quizResult.score}%</span> —{' '}
                    {quizResult.passed ? 'Passed (lesson marked complete)' : 'Not passed yet — review and try again'}
                  </div>
                ) : null}

                <Button
                  className="w-full"
                  onClick={() => submitQuiz.mutate()}
                  disabled={submitQuiz.isPending || (quizQuery.data as any).quiz.questions.some((qq: any) => !answers[qq.id])}
                >
                  {submitQuiz.isPending ? 'Submitting…' : 'Submit quiz'}
                </Button>

                {submitQuiz.isError ? (
                  <div className="rounded-md border bg-muted p-3 text-sm">
                    {submitQuiz.error instanceof Error ? submitQuiz.error.message : 'Quiz submission failed'}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="text-sm font-medium">Module navigation</div>
            <div className="mt-3 space-y-1">
              {L.navigation.siblings.map((s) => (
                <Link
                  key={s.id}
                  href={`/dashboard/lessons/${s.slug}`}
                  className={`block rounded-md px-2 py-1 text-sm hover:bg-muted ${
                    s.slug === L.slug ? 'bg-muted' : ''
                  }`}
                >
                  {s.title}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

