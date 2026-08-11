'use client';

import Link from 'next/link';
import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MessageSquareMore,
  Rocket,
  Sparkles,
  Star,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { eventsApi, lessonsApi, progressApi, quizzesApi } from '@/lib/api/endpoints';
import { aiApi } from '@/lib/api/endpoints';
import { MediaVideoFrame } from '@/components/site/MediaVideoFrame';
import { useToast } from '@/components/toast/toast-provider';
import { AiStructuredPanel } from '@/components/ai/AiStructuredPanel';
import type {
  AiExplainAnswerResponse,
  LessonBlock,
  LessonDetail,
  LessonQuizResponse,
  QuizSubmitResult,
  SubmitQuizAnswer,
} from '@/lib/content/types';
import { resolveModuleIntroVideoUrl } from '@/lib/content/media';
import { headingFont } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { AiTeacherPanel } from './AiTeacherPanel';
import { ReadingProgressBar } from '@/components/lesson/ReadingProgressBar';
import { LessonNavigation } from '@/components/lesson/LessonNavigation';
import { CompletionCelebration } from '@/components/lesson/CompletionCelebration';
import { LessonNotes } from '@/components/lesson/LessonNotes';
import { TimestampedVideoNotes } from '@/components/lesson/TimestampedVideoNotes';
import { CodePlayground } from '@/components/lesson/CodePlayground';

type QuizAnswerState = Record<string, string | string[]>;

function BlockRenderer({ block }: { block: LessonBlock }) {
  const content = block.content ?? {};

  switch (block.type) {
    case 'heading':
      return (
        <div className="rounded-[1.7rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_36px_var(--site-shadow)]">
          <h2 className={cn('text-3xl font-extrabold leading-tight text-[var(--site-text)]', headingFont.className)}>
            {content.text ?? ''}
          </h2>
        </div>
      );
    case 'paragraph':
      return (
        <div className="rounded-[1.7rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_36px_var(--site-shadow)]">
          <p className="text-base leading-8 text-[var(--site-muted)]">{content.text ?? ''}</p>
        </div>
      );
    case 'bullet_list':
      return (
        <div className="rounded-[1.7rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_36px_var(--site-shadow)]">
          <div className="space-y-3">
            {(content.bullets ?? []).map((bullet: string, index: number) => (
              <div key={index} className="flex items-start gap-3 rounded-[1.2rem] bg-[var(--site-surface-alt)] px-4 py-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--site-primary)]" />
                <span className="text-sm leading-7 text-[var(--site-muted)]">{bullet}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'code_block':
      return (
        <CodePlayground
          initialCode={content.code ?? ''}
          language={(content.language as any) ?? 'javascript'}
          title={content.title ?? 'Interactive Lesson Sandbox'}
          testCases={content.testCases}
        />
      );
    case 'callout': {
      const variant = String(content.variant ?? 'note').toLowerCase();
      const tone = variant.includes('warn')
        ? 'border-[var(--site-border)] bg-[var(--site-warm-soft)] text-[var(--site-warm)]'
        : variant.includes('success')
          ? 'border-[var(--site-border)] bg-[var(--site-success-soft)] text-[var(--site-success)]'
          : 'border-[var(--site-border)] bg-[var(--site-primary-soft)] text-[var(--site-primary)]';

      return (
        <div className={cn('rounded-[1.7rem] border p-6 shadow-[0_18px_36px_var(--site-shadow)]', tone)}>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.22em]">
            {content.variant ?? 'Note'}
          </div>
          <div className="mt-2 text-sm leading-7">{content.text ?? ''}</div>
        </div>
      );
    }
    case 'example':
      return (
        <div className="rounded-[1.7rem] border border-[var(--site-border)] bg-[var(--site-warm-soft)] p-6 shadow-[0_18px_36px_var(--site-shadow)]">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--site-warm)]">Example</div>
          <div className="mt-2 text-2xl font-bold text-[var(--site-text)]">{content.title ?? 'Worked example'}</div>
          <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">{content.text ?? ''}</p>
        </div>
      );
    case 'recap':
      return (
        <div className="rounded-[1.7rem] border border-[var(--site-border)] bg-[var(--site-primary-soft)] p-6 shadow-[0_18px_36px_var(--site-shadow)]">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--site-primary)]">Recap</div>
          <div className="mt-3 space-y-3">
            {(content.bullets ?? []).map((bullet: string, index: number) => (
              <div key={index} className="flex items-start gap-3 rounded-[1.2rem] bg-[var(--site-surface)] px-4 py-3">
                <CheckCircle2 className="mt-1 h-4 w-4 text-[var(--site-primary)]" />
                <span className="text-sm leading-7 text-[var(--site-muted)]">{bullet}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'checkpoint_intro':
      return (
        <div className="rounded-[1.7rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_36px_var(--site-shadow)]">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--site-subtle)]">Checkpoint</div>
          <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">{content.text ?? ''}</p>
        </div>
      );
    case 'image':
      return (
        <div className="rounded-[1.7rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 shadow-[0_18px_36px_var(--site-shadow)]">
          {content.url ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]">
                <img
                  src={String(content.url)}
                  alt={String(content.alt ?? content.title ?? 'Lesson visual')}
                  className="h-auto w-full object-cover"
                />
              </div>
              {content.title || content.caption ? (
                <div className="rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3">
                  {content.title ? (
                    <div className="text-sm font-semibold text-[var(--site-text)]">{String(content.title)}</div>
                  ) : null}
                  {content.caption ? (
                    <div className="mt-1 text-sm leading-7 text-[var(--site-subtle)]">{String(content.caption)}</div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-[var(--site-border)] bg-[var(--site-surface-alt)] p-6 text-center text-sm leading-7 text-[var(--site-subtle)]">
              This lesson image has not been added yet.
            </div>
          )}
        </div>
      );
    case 'video':
      return (
        <div className="rounded-[1.7rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 shadow-[0_18px_36px_var(--site-shadow)]">
          {content.url ? (
            <MediaVideoFrame
              url={String(content.url)}
              title={typeof content.title === 'string' ? content.title : null}
              caption={typeof content.caption === 'string' ? content.caption : null}
              posterUrl={typeof content.posterUrl === 'string' ? content.posterUrl : null}
            />
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-[var(--site-border)] bg-[var(--site-surface-alt)] p-6 text-center text-sm leading-7 text-[var(--site-subtle)]">
              This lesson video has not been added yet.
            </div>
          )}
        </div>
      );
    default:
      return (
        <div className="rounded-[1.7rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 text-sm text-[var(--site-subtle)] shadow-[0_18px_36px_var(--site-shadow)]">
          This lesson block is not available yet.
        </div>
      );
  }
}

export function LessonClient({ lessonSlug }: { lessonSlug: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const lessonQuery = useQuery({
    queryKey: ['lessons', 'bySlug', lessonSlug],
    queryFn: () => lessonsApi.bySlug(lessonSlug),
  });

  const lesson = lessonQuery.data;

  React.useEffect(() => {
    if (!lesson?.id) return;
    eventsApi.lessonOpened(lesson.id).catch(() => {});
  }, [lesson?.id]);

  const courseProgressQuery = useQuery({
    enabled: Boolean(lesson?.course?.id),
    queryKey: ['progress', 'course', lesson?.course?.id],
    queryFn: () => progressApi.course(lesson!.course.id),
  });

  const quizQuery = useQuery({
    enabled: Boolean(lesson?.id),
    queryKey: ['quizzes', 'lesson', lesson?.id],
    queryFn: () => quizzesApi.lessonQuiz(lesson!.id),
  });

  const [showCelebration, setShowCelebration] = React.useState(false);

  const completeMutation = useMutation({
    mutationFn: async () => progressApi.completeLesson(lesson!.id),
    onSuccess: async () => {
      setShowCelebration(true);
      toast({ title: 'Lesson completed', description: 'Your progress has been updated.' });
      await queryClient.invalidateQueries({ queryKey: ['progress', 'course', lesson?.course?.id] });
      await queryClient.invalidateQueries({ queryKey: ['progress', 'dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['progress', 'profile'] });
    },
    onError: (error) => {
      toast({
        title: 'Could not complete lesson',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const [answers, setAnswers] = React.useState<QuizAnswerState>({});
  const [quizResult, setQuizResult] = React.useState<QuizSubmitResult | null>(null);
  const [explanations, setExplanations] = React.useState<Record<string, AiExplainAnswerResponse>>({});

  const explainMutation = useMutation({
    mutationFn: async (input: {
      questionId: string;
      selectedOptionId?: string;
      userAnswerText?: string;
      orderedAnswer?: string[];
    }) =>
      aiApi.explainAnswer({
        lessonId: lesson!.id,
        questionId: input.questionId,
        selectedOptionId: input.selectedOptionId,
        userAnswerText: input.userAnswerText,
        orderedAnswer: input.orderedAnswer,
      }),
    onSuccess: (response, variables) => {
      setExplanations((current) => ({ ...current, [variables.questionId]: response }));
    },
  });

  const submitQuiz = useMutation({
    mutationFn: async () => {
      const quiz = quizQuery.data as LessonQuizResponse;
      if (!quiz || quiz.hasQuiz === false) throw new Error('No quiz available');
      const payload: SubmitQuizAnswer[] = quiz.quiz.questions.map((question) => {
        const answer = answers[question.id];

        if (question.type === 'short_answer') {
          return {
            questionId: question.id,
            textAnswer: typeof answer === 'string' ? answer.trim() : '',
          };
        }

        if (question.type === 'ordered') {
          return {
            questionId: question.id,
            orderedAnswer: Array.isArray(answer) ? answer : question.options.map((option) => option.id),
          };
        }

        return {
          questionId: question.id,
          selectedOptionId: typeof answer === 'string' ? answer : undefined,
        };
      });
      return quizzesApi.submitLessonQuiz(lesson!.id, payload);
    },
    onSuccess: async (response) => {
      setQuizResult(response);
      toast({
        title: response.passed ? 'Quiz passed' : 'Quiz submitted',
        description: `Score: ${response.score}%`,
      });
      await queryClient.invalidateQueries({ queryKey: ['progress', 'course', lesson?.course?.id] });
      await queryClient.invalidateQueries({ queryKey: ['progress', 'dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['progress', 'profile'] });
    },
    onError: (error) => {
      toast({
        title: 'Quiz submission failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  if (lessonQuery.isLoading) {
    return (
      <main className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <div className="h-[520px] rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
        <div className="h-[720px] rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
        <div className="h-[520px] rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
      </main>
    );
  }

  if (lessonQuery.isError || !lesson) {
    return (
      <main className="rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
        <div className="font-semibold">Could not load lesson</div>
        <div className="mt-2">
          {lessonQuery.error instanceof Error ? lessonQuery.error.message : 'Unknown error'}
        </div>
      </main>
    );
  }

  const lessonCompleted = Boolean(
    courseProgressQuery.data?.modules
      .flatMap((module) => module.lessons)
      .find((courseLesson) => courseLesson.id === lesson.id)?.completed,
  );
  const currentModuleProgress = courseProgressQuery.data?.modules.find(
    (module) => module.id === lesson.module.id,
  );
  const moduleLessonStates = new Map(
    currentModuleProgress?.lessons.map((courseLesson) => [courseLesson.slug, courseLesson]) ?? [],
  );
  const hasQuiz = Boolean(
    quizQuery.data && (quizQuery.data as LessonQuizResponse).hasQuiz === true,
  );
  const quizPassed = quizResult?.passed ?? false;
  const checkpointPending = hasQuiz && !quizPassed;
  const canMarkComplete = !lessonCompleted && (!hasQuiz || quizPassed);
  const earnedXp = Math.max(50, (lesson.estimatedMinutes ?? 10) * 5);
  const moduleLeaderboard = lesson.moduleLeaderboard ?? [];
  const siblingLessons = lesson.navigation.siblings;
  const currentLessonIndex = siblingLessons.findIndex((item) => item.slug === lesson.slug);
  const prevLesson = currentLessonIndex > 0 ? siblingLessons[currentLessonIndex - 1] ?? null : null;
  const nextLesson =
    currentLessonIndex >= 0 && currentLessonIndex < siblingLessons.length - 1
      ? siblingLessons[currentLessonIndex + 1] ?? null
      : null;

  return (
    <>
    <ReadingProgressBar />
    {showCelebration && (
      <CompletionCelebration
        xpEarned={earnedXp}
        onDismiss={() => setShowCelebration(false)}
      />
    )}
    <main className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--site-muted)]">
        <Link
          href="/dashboard"
          className="font-semibold text-[var(--site-text)] transition hover:text-[var(--site-primary)]"
        >
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4 text-[var(--site-subtle)]" />
        <Link
          href={`/dashboard/courses/${lesson.course.slug}`}
          className="font-semibold text-[var(--site-text)] transition hover:text-[var(--site-primary)]"
        >
          {lesson.course.title}
        </Link>
        <ChevronRight className="h-4 w-4 text-[var(--site-subtle)]" />
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-1 text-xs font-semibold text-[var(--site-text)]">
          Module {String(lesson.module.order + 1).padStart(2, '0')}
          <span className="text-[var(--site-subtle)]">{lesson.module.title}</span>
        </span>
        <ChevronRight className="h-4 w-4 text-[var(--site-subtle)]" />
        <span className="font-semibold text-[var(--site-subtle)]">{lesson.title}</span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/dashboard/courses/${lesson.course.slug}`}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2 text-xs font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-alt)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to course
        </Link>
        {checkpointPending ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--site-warm)]/30 bg-[var(--site-warm-soft)] px-3 py-2 text-xs font-semibold text-[var(--site-warm)]">
            Checkpoint pending
          </span>
        ) : null}
        {prevLesson ? (
          <Link
            href={`/dashboard/lessons/${prevLesson.slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2 text-xs font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-alt)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Previous lesson
          </Link>
        ) : null}
        {nextLesson ? (
          <Link
            href={`/dashboard/lessons/${nextLesson.slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-primary)] px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)]"
          >
            Next lesson
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
      <aside className="space-y-5">
        <div className="rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_40px_var(--site-shadow)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--site-subtle)]">
                Module {String(lesson.module.order + 1).padStart(2, '0')}
              </div>
              <div className="text-2xl font-bold text-[var(--site-text)]">{lesson.module.title}</div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {lesson.navigation.siblings.map((item) => {
              const isCurrent = item.slug === lesson.slug;
              const completed = Boolean(moduleLessonStates.get(item.slug)?.completed);

              return (
                <Link
                  key={item.id}
                  href={`/dashboard/lessons/${item.slug}`}
                  className={cn(
                    'flex items-center gap-3 rounded-[1.2rem] px-4 py-3 text-sm font-medium transition',
                    isCurrent
                      ? 'border border-[var(--site-border)] bg-[var(--site-primary-soft)] text-[var(--site-primary)]'
                      : 'border border-transparent text-[var(--site-subtle)] hover:bg-[var(--site-surface-alt)]',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                      isCurrent && 'bg-[var(--site-primary)] text-white',
                      !isCurrent && completed && 'bg-[var(--site-success-soft)] text-[var(--site-success)]',
                      !isCurrent && !completed && 'bg-[var(--site-surface-alt)] text-[var(--site-subtle)]',
                    )}
                  >
                    {isCurrent ? (
                      <Rocket className="h-4 w-4" />
                    ) : completed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Clock3 className="h-4 w-4" />
                    )}
                  </span>
                  <span className="line-clamp-2">{item.title}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 border-t border-[var(--site-border)] pt-5">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--site-subtle)]">
              <span>Lesson progress</span>
              <span>{courseProgressQuery.data?.percent ?? 0}%</span>
            </div>
            <div className="mt-3 h-3 rounded-full bg-[var(--site-border)]">
              <div
                className="h-3 rounded-full bg-[var(--site-primary)]"
                style={{ width: `${courseProgressQuery.data?.percent ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-success-soft)] p-5 text-[var(--site-success)] shadow-[0_20px_40px_var(--site-shadow)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--site-success)]/80">Nice work</div>
              <div className="mt-2 text-3xl font-extrabold">+{earnedXp} XP</div>
            </div>
            <Star className="h-8 w-8" />
          </div>
          <div className="mt-3 text-sm leading-7 text-[var(--site-success)]">
            Lesson completion rewards are now reflected in your progress automatically.
          </div>
        </div>
      </aside>

      <section className="space-y-6">
        <div className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_22px_48px_var(--site-shadow)] lg:p-8">
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[var(--site-muted)]">
            <Link href="/dashboard/courses" className="inline-flex items-center gap-2 text-[var(--site-subtle)] transition hover:text-[var(--site-primary)]">
              <ArrowLeft className="h-4 w-4" />
              My courses
            </Link>
            <ChevronRight className="h-4 w-4 text-[var(--site-subtle)]" />
            <Link href={`/dashboard/courses/${lesson.course.slug}`} className="text-[var(--site-subtle)] transition hover:text-[var(--site-primary)]">
              {lesson.course.title}
            </Link>
            <ChevronRight className="h-4 w-4 text-[var(--site-subtle)]" />
            <span className="text-[var(--site-primary)]">Current lesson</span>
          </div>

          <div className="mt-6 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary-soft)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--site-primary)]">
              {lesson.course.title} / {lesson.module.title}
            </div>
            <h1 className={cn('text-5xl font-extrabold leading-[0.96] tracking-[-0.05em] text-[var(--site-text)] lg:text-6xl', headingFont.className)}>
              {lesson.title}
            </h1>
            <p className="max-w-[820px] text-lg leading-8 text-[var(--site-muted)]">
              {lesson.learningObjective ??
                'This lesson keeps the reading area focused on the current module and the next step in your roadmap.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[var(--site-muted)]">
              <span className="rounded-full bg-[var(--site-surface-alt)] px-4 py-2">
                {lesson.estimatedMinutes ? `${lesson.estimatedMinutes} mins` : 'Short lesson'}
              </span>
              {lessonCompleted ? (
                <span className="rounded-full bg-[var(--site-success-soft)] px-4 py-2 text-[var(--site-success)]">Completed</span>
              ) : (
                <span className="rounded-full bg-[var(--site-warm-soft)] px-4 py-2 text-[var(--site-warm)]">In progress</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {resolveModuleIntroVideoUrl(lesson.module) ? (
            <div className="rounded-[1.7rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 shadow-[0_18px_36px_var(--site-shadow)]">
              <div className="mb-4 text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--site-subtle)]">
                Module walkthrough
              </div>
              <MediaVideoFrame
                url={resolveModuleIntroVideoUrl(lesson.module)!}
                title={`${lesson.module.title} video walkthrough`}
                caption="Use this walkthrough to get oriented before you move through the lesson blocks."
              />
            </div>
          ) : null}

          {lesson.blocks.length === 0 ? (
            <div className="rounded-[1.8rem] border border-dashed border-[var(--site-border)] bg-[var(--site-surface)] p-8 text-sm text-[var(--site-subtle)] shadow-[0_18px_36px_var(--site-shadow)]">
              This lesson does not have published content yet. Return to the course roadmap and continue with the next available step.
            </div>
          ) : (
            lesson.blocks.map((block) => <BlockRenderer key={block.id} block={block} />)
          )}
        </div>

        <QuizCard
          answers={answers}
          explanations={explanations}
          explainMutationPending={explainMutation.isPending}
          hasQuiz={hasQuiz}
          quizQuery={quizQuery}
          quizResult={quizResult}
          setAnswers={setAnswers}
          onExplain={(input) =>
            explainMutation.mutate(input)
          }
          onSubmit={() => submitQuiz.mutate()}
          submitPending={submitQuiz.isPending}
        />

        <div className="flex flex-col gap-6">
          <LessonNavigation lesson={lesson} />
          
          <div className="flex justify-end">
            <Button
              variant={lessonCompleted ? 'outline' : 'default'}
              size="lg"
              disabled={!canMarkComplete || completeMutation.isPending}
              onClick={() => completeMutation.mutate()}
              className={cn(
                'rounded-full px-6',
                lessonCompleted
                  ? 'border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-text)] hover:bg-[var(--site-surface-alt)]'
                  : 'bg-[var(--site-primary)] text-white hover:bg-[var(--site-primary-strong)]',
              )}
            >
              {lessonCompleted ? 'Completed' : completeMutation.isPending ? 'Completing...' : 'Mark complete'}
            </Button>
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <AiTeacherPanel lessonId={lesson.id} />

        <div className="rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_40px_var(--site-shadow)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-[var(--site-text)]">Top in this module</div>
              <div className="text-sm text-[var(--site-subtle)]">Learners progressing through this module</div>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {moduleLeaderboard.length === 0 ? (
              <div className="rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-4 text-sm leading-7 text-[var(--site-muted)]">
                Your module leaderboard will appear once learners begin completing lessons here.
              </div>
            ) : (
              moduleLeaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={cn(
                    'flex items-center justify-between rounded-[1.2rem] border px-4 py-3',
                    entry.isCurrentUser
                      ? 'border-[var(--site-primary)]/35 bg-[var(--site-primary-soft)]'
                      : 'border-[var(--site-border)] bg-[var(--site-surface-alt)]',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--site-surface)] text-sm font-bold text-[var(--site-primary)]">
                      {entry.rank}
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--site-text)]">
                        {entry.name}
                        {entry.isCurrentUser ? ' (You)' : ''}
                      </div>
                      <div className="text-xs text-[var(--site-subtle)]">
                        {entry.completedLessons} of {entry.totalLessons} lessons completed
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[var(--site-subtle)]">
                    {entry.xp.toLocaleString()} XP
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_40px_var(--site-shadow)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--site-warm-soft)] text-[var(--site-warm)]">
              <MessageSquareMore className="h-5 w-5" />
            </div>
            <div className="text-xl font-bold text-[var(--site-text)]">Lesson discussion</div>
          </div>
          <div className="mt-4 rounded-[1.3rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4 text-sm leading-7 text-[var(--site-muted)]">
            Use the community hub for lesson questions, mentor help, and peer discussions tied to what
            you are learning now.
          </div>
          <Link
            href="/community"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)]"
          >
            Open community hub
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </aside>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-5 py-4 shadow-[0_16px_32px_var(--site-shadow)]">
        <div className="text-sm text-[var(--site-muted)]">
          {nextLesson
            ? `Up next: ${nextLesson.title}`
            : 'You reached the final lesson in this module.'}
          {checkpointPending ? ' Finish the checkpoint to unlock the next module.' : ''}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {prevLesson ? (
            <Link
              href={`/dashboard/lessons/${prevLesson.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2 text-xs font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-alt)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Previous lesson
            </Link>
          ) : null}
          <Link
            href={
              nextLesson
                ? `/dashboard/lessons/${nextLesson.slug}`
                : `/dashboard/courses/${lesson.course.slug}`
            }
            className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary)] px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)]"
          >
            {nextLesson ? 'Continue to next lesson' : 'Back to course'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
      <div className="mt-8">
        <TimestampedVideoNotes lessonId={lesson.id} />
      </div>
      <LessonNotes lessonSlug={lessonSlug} />
    </main>
    </>
  );
}

function QuizCard({
  answers,
  explanations,
  explainMutationPending,
  hasQuiz,
  quizQuery,
  quizResult,
  setAnswers,
  onExplain,
  onSubmit,
  submitPending,
}: {
  answers: QuizAnswerState;
  explanations: Record<string, AiExplainAnswerResponse>;
  explainMutationPending: boolean;
  hasQuiz: boolean;
  quizQuery: {
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    data: LessonQuizResponse | undefined;
  };
  quizResult: QuizSubmitResult | null;
  setAnswers: React.Dispatch<React.SetStateAction<QuizAnswerState>>;
  onExplain: (input: {
    questionId: string;
    selectedOptionId?: string;
    userAnswerText?: string;
    orderedAnswer?: string[];
  }) => void;
  onSubmit: () => void;
  submitPending: boolean;
}) {
  const quiz = quizQuery.data && quizQuery.data.hasQuiz ? quizQuery.data.quiz : null;

  const isQuestionAnswered = React.useCallback(
    (question: { id: string; type: string; options: Array<{ id: string }> }) => {
      const answer = answers[question.id];
      if (question.type === 'short_answer') {
        return typeof answer === 'string' && answer.trim().length > 0;
      }
      if (question.type === 'ordered') {
        return Array.isArray(answer) && answer.length === question.options.length;
      }
      return typeof answer === 'string' && answer.length > 0;
    },
    [answers],
  );

  const moveOrderedAnswer = React.useCallback(
    (questionId: string, optionIds: string[], fromIndex: number, direction: -1 | 1) => {
      setAnswers((current) => {
        const existing = current[questionId];
        const base = Array.isArray(existing) && existing.length === optionIds.length ? [...existing] : [...optionIds];
        const targetIndex = fromIndex + direction;
        if (targetIndex < 0 || targetIndex >= base.length) {
          return current;
        }

        const [moved] = base.splice(fromIndex, 1);
        base.splice(targetIndex, 0, moved);
        return { ...current, [questionId]: base };
      });
    },
    [setAnswers],
  );

  React.useEffect(() => {
    if (!quiz) return;

    setAnswers((current) => {
      let changed = false;
      const next = { ...current };

      for (const question of quiz.questions) {
        if (question.type !== 'ordered') continue;
        const optionIds = question.options.map((option) => option.id);
        const existing = next[question.id];
        if (!Array.isArray(existing) || existing.length !== optionIds.length) {
          next[question.id] = optionIds;
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [quiz, setAnswers]);

  return (
    <div className="rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_40px_var(--site-shadow)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
          <Rocket className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xl font-bold text-[var(--site-text)]">Checkpoint</div>
          <div className="text-sm text-[var(--site-subtle)]">Check what you understood before moving to the next part.</div>
        </div>
      </div>

      {quizQuery.isLoading ? (
        <div className="mt-5 text-sm text-[var(--site-subtle)]">Loading quiz...</div>
      ) : quizQuery.isError ? (
        <div className="mt-5 rounded-[1.3rem] border border-[var(--site-border)] bg-[var(--site-danger-soft)] p-4 text-sm text-[var(--site-danger)]">
          {quizQuery.error instanceof Error ? quizQuery.error.message : 'Quiz unavailable'}
        </div>
      ) : !hasQuiz ? (
        <div className="mt-5 rounded-[1.3rem] border border-dashed border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4 text-sm leading-7 text-[var(--site-subtle)]">
          This lesson does not have a quiz yet.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {quiz!.questions.map((question, index) => (
            <div key={question.id} className="rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5">
              <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--site-subtle)]">Question {index + 1}</div>
              <div className="mt-2 text-lg font-bold leading-8 text-[var(--site-text)]">{question.prompt}</div>

              <div className="mt-4 space-y-3">
                {question.type === 'short_answer' ? (
                  <textarea
                    value={typeof answers[question.id] === 'string' ? answers[question.id] : ''}
                    onChange={(event) =>
                      setAnswers((current) => ({ ...current, [question.id]: event.target.value }))
                    }
                    rows={4}
                    placeholder="Write your answer in your own words."
                    className="w-full rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm leading-7 text-[var(--site-text)] outline-none transition focus:border-[var(--site-primary)] focus:ring-2 focus:ring-[var(--site-primary)]/15"
                  />
                ) : question.type === 'ordered' ? (
                  <div className="space-y-3">
                    {(() => {
                      const optionIds = question.options.map((option) => option.id);
                      const orderedAnswer =
                        Array.isArray(answers[question.id]) && answers[question.id].length === optionIds.length
                          ? (answers[question.id] as string[])
                          : optionIds;

                      return orderedAnswer.map((optionId, orderedIndex) => {
                        const option = question.options.find((entry) => entry.id === optionId);
                        return (
                          <div
                            key={`${question.id}-${optionId}-${orderedIndex}`}
                            className="flex items-center gap-3 rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--site-primary-soft)] text-xs font-bold text-[var(--site-primary)]">
                              {orderedIndex + 1}
                            </span>
                            <span className="flex-1 text-sm text-[var(--site-text)]">
                              {option?.text ?? 'Unknown option'}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => moveOrderedAnswer(question.id, optionIds, orderedIndex, -1)}
                                disabled={orderedIndex === 0}
                                className="rounded-full border border-[var(--site-border)] px-3 py-1 text-xs font-semibold text-[var(--site-primary)] disabled:opacity-40"
                              >
                                Up
                              </button>
                              <button
                                type="button"
                                onClick={() => moveOrderedAnswer(question.id, optionIds, orderedIndex, 1)}
                                disabled={orderedIndex === orderedAnswer.length - 1}
                                className="rounded-full border border-[var(--site-border)] px-3 py-1 text-xs font-semibold text-[var(--site-primary)] disabled:opacity-40"
                              >
                                Down
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  question.options.map((option) => (
                    <label
                      key={option.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-[1.2rem] border px-4 py-3 text-sm transition',
                        answers[question.id] === option.id
                          ? 'border-[var(--site-primary)] bg-[var(--site-surface)] text-[var(--site-text)]'
                          : 'border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-muted)] hover:bg-[var(--site-primary-soft)]',
                      )}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option.id}
                        checked={answers[question.id] === option.id}
                        onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                      />
                      <span>{option.text}</span>
                    </label>
                  ))
                )}
              </div>

              {quizResult ? (
                <div className="mt-4 rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-4 text-sm leading-7 text-[var(--site-muted)]">
                  {quizResult.questions.find((result) => result.questionId === question.id)?.isCorrect ? (
                    <span className="font-semibold text-[var(--site-success)]">Correct answer.</span>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <span className="font-semibold text-[var(--site-danger)]">Incorrect.</span>{' '}
                        {quizResult.questions.find((result) => result.questionId === question.id)?.explanation ?? 'Try reviewing the lesson and ask the AI tutor for help.'}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const selectedAnswer = answers[question.id];
                          if (question.type === 'short_answer') {
                            onExplain({
                              questionId: question.id,
                              userAnswerText: typeof selectedAnswer === 'string' ? selectedAnswer : '',
                            });
                            return;
                          }
                          if (question.type === 'ordered') {
                            onExplain({
                              questionId: question.id,
                              orderedAnswer: Array.isArray(selectedAnswer)
                                ? selectedAnswer
                                : question.options.map((option) => option.id),
                            });
                            return;
                          }
                          onExplain({
                            questionId: question.id,
                            selectedOptionId: Array.isArray(selectedAnswer) ? undefined : selectedAnswer,
                          });
                        }}
                        disabled={explainMutationPending}
                        className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-primary)] transition hover:bg-[var(--site-primary-soft)]"
                      >
                        {explainMutationPending ? 'Explaining...' : 'Explain with AI'}
                      </button>
                      {explanations[question.id] ? (
                        explanations[question.id].structured ? (
                          <AiStructuredPanel data={explanations[question.id].structured} />
                        ) : (
                          <div className="rounded-[1.1rem] bg-[var(--site-primary-soft)] px-4 py-3 text-[var(--site-muted)]">
                            {explanations[question.id].explanation}
                          </div>
                        )
                      ) : null}
                      {explanations[question.id]?.providerStatus === 'fallback' ? (
                        <div className="rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3 text-xs leading-6 text-[var(--site-subtle)]">
                          {explanations[question.id]?.errorMessage ?? 'The live AI tutor is unavailable, so this explanation was generated from the current lesson content.'}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ))}

          {quizResult ? (
            <div className="rounded-[1.3rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-4 text-sm leading-7 text-[var(--site-muted)]">
              Score: <span className="font-bold text-[var(--site-text)]">{quizResult.score}%</span> -{' '}
              {quizResult.passed ? 'Passed. You can mark the lesson complete now.' : 'Not passed yet. Review and try again.'}
            </div>
          ) : null}

          <Button
            className="h-12 rounded-full bg-[var(--site-primary)] px-6 text-white hover:bg-[var(--site-primary-strong)]"
            onClick={onSubmit}
            disabled={
              submitPending || quiz!.questions.some((question) => !isQuestionAnswered(question))
            }
          >
            {submitPending ? 'Submitting...' : 'Submit quiz'}
          </Button>
        </div>
      )}
    </div>
  );
}
