'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, HelpCircle, Plus, Save, Trash2 } from 'lucide-react';

import {
  AdminField,
  adminInputClassName,
  adminSelectClassName,
  adminTextareaClassName,
} from '@/components/admin/AdminForms';
import { ContentRevisionPanel } from '@/components/admin/ContentRevisionPanel';
import { AdminPageIntro, AdminStatusPill, AdminSurface } from '@/components/admin/AdminUi';
import { useToast } from '@/components/toast/toast-provider';
import { adminApi } from '@/lib/api/endpoints';
import type { AdminQuiz } from '@/lib/content/types';

type QuizRevisionQuestion = {
  type: string;
  difficulty: number;
  prompt: string;
  explanation?: string | null;
  order: number;
  correctOptionIndex: number;
  correctText?: string | null;
  correctOrder?: string[];
  options: Array<{ text: string; order: number }>;
};

type RevisionRendererContext = {
  side: 'revision' | 'current';
  otherValue: unknown;
  fieldKey: string;
};

function parseStringArray(input: string, fieldLabel: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error(`${fieldLabel} must be a JSON array of strings.`);
  }

  if (!Array.isArray(parsed) || parsed.some((entry) => typeof entry !== 'string')) {
    throw new Error(`${fieldLabel} must be a JSON array of strings.`);
  }

  return parsed.map((entry) => entry.trim()).filter(Boolean);
}

function parseNumberArray(input: string, fieldLabel: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error(`${fieldLabel} must be a JSON array of numbers.`);
  }

  if (!Array.isArray(parsed) || parsed.some((entry) => typeof entry !== 'number' || Number.isNaN(entry))) {
    throw new Error(`${fieldLabel} must be a JSON array of numbers.`);
  }

  return parsed;
}

function buildQuizQuestionSnapshot(quiz?: AdminQuiz | null): QuizRevisionQuestion[] {
  return (quiz?.questions ?? []).map((question) => ({
    type: question.type,
    difficulty: question.difficulty,
    prompt: question.prompt,
    explanation: question.explanation ?? null,
    order: question.order,
    correctOptionIndex: question.options.findIndex(
      (option) => option.id === question.correctOptionId,
    ),
    correctText: question.correctText ?? null,
    correctOrder: question.correctOrder ?? [],
    options: question.options.map((option) => ({
      text: option.text,
      order: option.order,
    })),
  }));
}

function getQuestionChangeNotes(
  question: QuizRevisionQuestion,
  counterpart?: QuizRevisionQuestion,
) {
  if (!counterpart) return ['Question only exists in this version.'];

  const notes: string[] = [];
  if (question.type !== counterpart.type) {
    notes.push(`Type changed from ${counterpart.type} to ${question.type}.`);
  }
  if (question.prompt !== counterpart.prompt) {
    notes.push(`Prompt changed. Previous: ${counterpart.prompt}`);
  }
  if ((question.explanation ?? null) !== (counterpart.explanation ?? null)) {
    notes.push(
      `Explanation changed.${counterpart.explanation ? ` Previous: ${counterpart.explanation}` : ''}`,
    );
  }
  if (question.difficulty !== counterpart.difficulty) {
    notes.push(`Difficulty changed from ${counterpart.difficulty} to ${question.difficulty}.`);
  }
  if (question.correctOptionIndex !== counterpart.correctOptionIndex) {
    notes.push('Correct answer changed.');
  }
  if ((question.correctText ?? null) !== (counterpart.correctText ?? null)) {
    notes.push(
      `Accepted answer changed.${counterpart.correctText ? ` Previous: ${counterpart.correctText}` : ''}`,
    );
  }
  if (JSON.stringify(question.correctOrder ?? []) !== JSON.stringify(counterpart.correctOrder ?? [])) {
    notes.push('Correct order changed.');
  }
  if (JSON.stringify(question.options) !== JSON.stringify(counterpart.options)) {
    notes.push('Answer options changed.');
  }
  return notes;
}

function renderQuestionsDiff(value: unknown, context: RevisionRendererContext) {
  const questions = Array.isArray(value) ? (value as QuizRevisionQuestion[]) : [];
  const otherQuestions = Array.isArray(context.otherValue)
    ? (context.otherValue as QuizRevisionQuestion[])
    : [];

  return (
    <div className="space-y-3">
      <div className="rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-3 py-2 text-sm text-[var(--site-muted)]">
        {questions.length} question{questions.length === 1 ? '' : 's'} in this version
      </div>

      <div className="space-y-3">
        {questions.map((question, index) => {
          const counterpart = otherQuestions[index];
          const notes = getQuestionChangeNotes(question, counterpart);
          const matchesOther = counterpart && JSON.stringify(question) === JSON.stringify(counterpart);

          return (
            <div
              key={`${question.order}-${question.prompt}`}
              className="rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-bg-soft)] p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
                  {question.type.replace(/_/g, ' ')}
                </span>
                <span className="rounded-full bg-[var(--site-surface-alt)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--site-subtle)]">
                  Difficulty {question.difficulty}
                </span>
                {matchesOther ? (
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-600">
                    Matches other version
                  </span>
                ) : counterpart ? (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-600">
                    Updated question
                  </span>
                ) : (
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600">
                    Only in this version
                  </span>
                )}
              </div>

              <div className="mt-3 text-sm font-semibold text-[var(--site-text)]">
                Q{index + 1}. {question.prompt}
              </div>

              <div className="mt-3 space-y-2">
                {question.options.map((option, optionIndex) => (
                  <div
                    key={`${option.order}-${option.text}`}
                    className="rounded-[0.9rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-2 text-sm text-[var(--site-muted)]"
                  >
                    <span className="font-medium text-[var(--site-text)]">{option.text}</span>
                    {question.correctOptionIndex === optionIndex ? (
                      <span className="ml-2 text-xs font-semibold text-primary">
                        Correct answer
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>

              {notes.length > 0 ? (
                <div className="mt-3 space-y-1">
                  {notes.map((note) => (
                    <div key={note} className="text-xs text-[var(--site-muted)]">
                      {note}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {otherQuestions.length > questions.length ? (
        <div className="rounded-[1rem] border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
          The other version includes {otherQuestions.length - questions.length} additional question
          {otherQuestions.length - questions.length === 1 ? '' : 's'}.
        </div>
      ) : null}
    </div>
  );
}

export function EditQuizClient({ id }: { id: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const quizQuery = useQuery({
    queryKey: ['admin', 'quizzes', id],
    queryFn: () => adminApi.quizzes.get(id),
  });

  const [title, setTitle] = React.useState('');
  const [passingScore, setPassingScore] = React.useState('70');
  const [status, setStatus] =
    React.useState<'draft' | 'published' | 'archived'>('draft');

  React.useEffect(() => {
    if (!quizQuery.data) return;
    setTitle(quizQuery.data.title ?? '');
    setPassingScore(String(quizQuery.data.passingScore));
    setStatus(quizQuery.data.status as 'draft' | 'published' | 'archived');
  }, [quizQuery.data]);

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
    onError: (error) =>
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const restoreRevision = useMutation({
    mutationFn: (revisionId: string) => adminApi.quizzes.restoreRevision(id, revisionId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'quizzes', id] });
      toast({
        title: 'Revision restored',
        description: 'The quiz was rolled back to the selected revision.',
      });
    },
    onError: (error) =>
      toast({
        title: 'Restore failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const [newPrompt, setNewPrompt] = React.useState('');
  const [newType, setNewType] = React.useState<
    'multiple_choice' | 'true_false' | 'short_answer' | 'ordered'
  >('multiple_choice');
  const [newExplanation, setNewExplanation] = React.useState('');
  const [newOptions, setNewOptions] = React.useState('["Option A","Option B"]');
  const [newCorrectIndex, setNewCorrectIndex] = React.useState('0');
  const [newCorrectText, setNewCorrectText] = React.useState('');
  const [newCorrectOrder, setNewCorrectOrder] = React.useState('[0,1]');

  const createQuestion = useMutation({
    mutationFn: async () => {
      const basePayload = {
        type: newType,
        prompt: newPrompt,
        explanation: newExplanation || undefined,
        difficulty: 1,
        order: quizQuery.data?.questions?.length ?? 0,
      };

      if (newType === 'short_answer') {
        if (!newCorrectText.trim()) {
          throw new Error('Accepted answer is required for short answer questions.');
        }

        return adminApi.quizzes.createQuestion(id, {
          ...basePayload,
          correctText: newCorrectText.trim(),
        });
      }

      const options = parseStringArray(newOptions, 'Answer options');

      if (options.length < 2) {
        throw new Error('Provide at least two answer options.');
      }

      if (newType === 'ordered') {
        const correctOrderIndices = parseNumberArray(newCorrectOrder, 'Correct order');

        return adminApi.quizzes.createQuestion(id, {
          ...basePayload,
          options: options.map((text, index) => ({ text, order: index })),
          correctOrderIndices,
        });
      }

      return adminApi.quizzes.createQuestion(id, {
        ...basePayload,
        options: options.map((text, index) => ({ text, order: index })),
        correctOptionIndex: Number(newCorrectIndex),
      });
    },
    onSuccess: async () => {
      setNewPrompt('');
      setNewExplanation('');
      setNewOptions('["Option A","Option B"]');
      setNewCorrectIndex('0');
      setNewCorrectText('');
      setNewCorrectOrder('[0,1]');
      await qc.invalidateQueries({ queryKey: ['admin', 'quizzes', id] });
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: (questionId: string) => adminApi.questions.remove(questionId),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['admin', 'quizzes', id] }),
  });

  const currentRevisionSnapshot = React.useMemo(
    () => ({
      title: title || null,
      passingScore: Number(passingScore || '0'),
      status,
      questions: buildQuizQuestionSnapshot(quizQuery.data),
    }),
    [passingScore, quizQuery.data, status, title],
  );

  const revisionFieldRenderers = React.useMemo(
    () => ({
      questions: (value: unknown, context: RevisionRendererContext) =>
        renderQuestionsDiff(value, context),
    }),
    [],
  );

  if (quizQuery.isLoading) {
    return (
      <main className="space-y-6">
        <div className="h-20 rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
        <div className="h-[34rem] rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
      </main>
    );
  }

  if (quizQuery.isError) {
    return (
      <main className="rounded-[1.8rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
        <div className="font-semibold">Could not load quiz</div>
        <div className="mt-2 text-[var(--site-danger)]/80">
          {quizQuery.error instanceof Error ? quizQuery.error.message : 'Unknown error'}
        </div>
      </main>
    );
  }

  const quiz = quizQuery.data!;

  return (
    <main className="space-y-6">
      <AdminPageIntro
        title="Edit Quiz"
        description="Control passing rules and manage all assessment questions from one place."
        actions={
          <div className="flex flex-wrap gap-3">
            {quiz.lesson ? (
              <Link
                href={`/admin/lessons/${quiz.lesson.id}/edit`}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 text-lg font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Lesson
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.2rem] bg-primary px-5 text-lg font-semibold text-primary-foreground shadow-[0_18px_34px_rgba(249,115,22,0.24)] transition hover:bg-primary/90 disabled:opacity-70"
            >
              <Save className="h-5 w-5" />
              {save.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <AdminSurface>
          <div className="grid gap-5 md:grid-cols-2">
            <AdminField label="Quiz Title" className="md:col-span-2">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={adminInputClassName}
                placeholder="Optional"
              />
            </AdminField>

            <AdminField label="Passing Score (%)">
              <input
                value={passingScore}
                onChange={(event) => setPassingScore(event.target.value)}
                className={adminInputClassName}
              />
            </AdminField>

            <AdminField label="Status">
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as 'draft' | 'published' | 'archived')
                }
                className={adminSelectClassName}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </AdminField>
          </div>

          {save.isError ? (
            <div className="mt-5 rounded-[1.2rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
              {save.error instanceof Error ? save.error.message : 'Save failed'}
            </div>
          ) : null}
        </AdminSurface>

        <AdminSurface>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
                Quiz Snapshot
              </div>
              <div className="mt-2">
                <AdminStatusPill tone={statusTone(status)}>{status.toUpperCase()}</AdminStatusPill>
              </div>
            </div>
          </div>
          {quiz.lesson ? (
            <div className="mt-5 text-sm text-[var(--site-muted)]">
              Linked lesson: <span className="font-semibold text-[var(--site-text)]">{quiz.lesson.title}</span>
            </div>
          ) : null}
        </AdminSurface>

        <ContentRevisionPanel
          title="Quiz Revisions"
          revisions={quizQuery.data?.revisions}
          onRestore={(revisionId) => restoreRevision.mutate(revisionId)}
          restoringRevisionId={restoreRevision.isPending ? restoreRevision.variables : null}
          currentSnapshot={currentRevisionSnapshot}
          fieldLabels={{
            passingScore: 'Passing score',
            questions: 'Quiz questions',
          }}
          fieldRenderers={revisionFieldRenderers}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <AdminSurface>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-[var(--site-text)]">Questions</h2>
              <p className="mt-1 text-base text-[var(--site-muted)]">Existing quiz questions and correct options.</p>
            </div>
          </div>

          {(quiz.questions?.length ?? 0) === 0 ? (
            <div className="mt-6 text-sm text-[var(--site-muted)]">No questions yet.</div>
          ) : (
            <div className="mt-6 space-y-3">
              {quiz.questions!.map((question) => (
                <div
                  key={question.id}
                  className="rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xl font-semibold text-[var(--site-text)]">{question.prompt}</div>
                      <div className="mt-2 text-sm uppercase tracking-[0.16em] text-[var(--site-subtle)]">
                        {question.type.replace(/_/g, ' ')} {' · '}difficulty {question.difficulty} {' · '}order {question.order}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteQuestion.mutate(question.id)}
                      disabled={deleteQuestion.isPending}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)] disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {question.type === 'short_answer' ? (
                      <div className="rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-bg-soft)] px-4 py-3">
                        <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--site-subtle)]">
                          Accepted answer
                        </div>
                        <div className="mt-2 text-base text-[var(--site-text)]">
                          {question.correctText || 'No accepted answer saved.'}
                        </div>
                      </div>
                    ) : question.type === 'ordered' ? (
                      <div className="space-y-2">
                        {(question.correctOrder ?? []).map((optionId, orderIndex) => {
                          const option = question.options.find((entry) => entry.id === optionId);
                          return (
                            <div
                              key={`${question.id}-${optionId}-${orderIndex}`}
                              className="flex items-center gap-3 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-bg-soft)] px-4 py-3"
                            >
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {orderIndex + 1}
                              </span>
                              <span className="text-base text-[var(--site-muted)]">
                                {option?.text ?? 'Unknown option'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      question.options.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center justify-between gap-4 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-bg-soft)] px-4 py-3"
                        >
                          <span className="text-base text-[var(--site-muted)]">{option.text}</span>
                          <span className="text-sm font-semibold text-primary">
                            {question.correctOptionId === option.id ? 'Correct answer' : ''}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminSurface>

        <AdminSurface>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-[var(--site-text)]">Add Question</h2>
              <p className="mt-1 text-base text-[var(--site-muted)]">Create new questions without leaving the page.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            <AdminField label="Prompt">
              <textarea
                value={newPrompt}
                onChange={(event) => setNewPrompt(event.target.value)}
                rows={4}
                className={adminTextareaClassName}
              />
            </AdminField>

            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Question Type">
                <select
                  value={newType}
                  onChange={(event) =>
                    setNewType(
                      event.target.value as
                        | 'multiple_choice'
                        | 'true_false'
                        | 'short_answer'
                        | 'ordered',
                    )
                  }
                  className={adminSelectClassName}
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True / False</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="ordered">Ordered</option>
                </select>
              </AdminField>

              {newType === 'short_answer' ? (
                <AdminField label="Accepted Answer">
                  <input
                    value={newCorrectText}
                    onChange={(event) => setNewCorrectText(event.target.value)}
                    className={adminInputClassName}
                    placeholder="e.g. A single cell"
                  />
                </AdminField>
              ) : newType === 'ordered' ? (
                <AdminField label="Correct Order (JSON Indices)">
                  <input
                    value={newCorrectOrder}
                    onChange={(event) => setNewCorrectOrder(event.target.value)}
                    className={adminInputClassName}
                    placeholder="[0,1,2]"
                  />
                </AdminField>
              ) : (
                <AdminField label="Correct Option Index">
                  <input
                    value={newCorrectIndex}
                    onChange={(event) => setNewCorrectIndex(event.target.value)}
                    className={adminInputClassName}
                  />
                </AdminField>
              )}
            </div>

            {newType !== 'short_answer' ? (
              <AdminField
                label={newType === 'ordered' ? 'Ordered Options (JSON Array)' : 'Answer Options (JSON Array)'}
              >
                <textarea
                  value={newOptions}
                  onChange={(event) => setNewOptions(event.target.value)}
                  rows={4}
                  className={`${adminTextareaClassName} font-mono text-sm leading-7`}
                />
              </AdminField>
            ) : null}

            <AdminField label="Explanation">
              <textarea
                value={newExplanation}
                onChange={(event) => setNewExplanation(event.target.value)}
                rows={4}
                className={adminTextareaClassName}
              />
            </AdminField>
          </div>

          <button
            type="button"
            onClick={() => createQuestion.mutate()}
            disabled={createQuestion.isPending || !newPrompt.trim()}
            className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-[1.2rem] bg-primary px-6 text-lg font-semibold text-primary-foreground shadow-[0_18px_34px_rgba(249,115,22,0.24)] transition hover:bg-primary/90 disabled:opacity-70"
          >
            <Plus className="h-5 w-5" />
            {createQuestion.isPending ? 'Creating...' : 'Add Question'}
          </button>

          {(createQuestion.isError || deleteQuestion.isError || restoreRevision.isError) ? (
            <div className="mt-5 rounded-[1.2rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
              {createQuestion.error instanceof Error
                ? createQuestion.error.message
                : deleteQuestion.error instanceof Error
                  ? deleteQuestion.error.message
                  : restoreRevision.error instanceof Error
                    ? restoreRevision.error.message
                  : 'Action failed'}
            </div>
          ) : null}
        </AdminSurface>
      </div>
    </main>
  );
}

function statusTone(status: string) {
  if (status === 'published') return 'emerald' as const;
  if (status === 'archived') return 'slate' as const;
  return 'orange' as const;
}
