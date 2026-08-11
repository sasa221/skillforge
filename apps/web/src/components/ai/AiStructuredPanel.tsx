'use client';

import type { AiChatMode, AiStructuredResponse } from '@/lib/content/types';

function buildQuizAnswerTemplate(questions: string[]) {
  return ['Check my answers for this quiz:', '', ...questions.map((_, index) => `${index + 1}. `)].join('\n');
}

function SectionList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (!items.length) return null;

  return (
    <div className="rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
        {title}
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="flex gap-3 text-sm text-[var(--site-muted)]">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--site-primary-soft)] text-xs font-bold text-[var(--site-primary)]">
              {index + 1}
            </div>
            <div className="leading-6">{item}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function verdictTone(verdict: string | null) {
  const normalized = verdict?.toLowerCase() ?? '';

  if (normalized.includes('strong') || normalized.includes('good')) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
  }
  if (normalized.includes('partly') || normalized.includes('partial')) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200';
  }
  if (normalized.includes('needs') || normalized.includes('revision')) {
    return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200';
  }

  return 'bg-[var(--site-primary-soft)] text-[var(--site-primary)]';
}

function confidenceTone(score: number | null) {
  if (score === null) return 'bg-[var(--site-primary-soft)] text-[var(--site-primary)]';
  if (score >= 75) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
  if (score >= 50) return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200';
  return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200';
}

export function AiStructuredPanel({
  data,
  onApplyPrompt,
}: {
  data: AiStructuredResponse | null;
  onApplyPrompt?: (input: { text: string; mode?: AiChatMode }) => void;
}) {
  if (!data) return null;

  if (data.type === 'study_plan') {
    return (
      <div className="mt-3 rounded-[1.25rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
          Suggested study plan
        </div>
        {data.focus ? (
          <div className="mt-3 rounded-[1rem] bg-[var(--site-surface)] px-4 py-3 text-sm leading-6 text-[var(--site-text)]">
            {data.focus}
          </div>
        ) : null}
        {data.progressNote ? (
          <div className="mt-3 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm leading-6 text-[var(--site-muted)]">
            {data.progressNote}
          </div>
        ) : null}
        {data.currentModuleLabel || data.nextStepLabel || data.checkpointPending ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.currentModuleLabel ? (
              <div className="rounded-full bg-[var(--site-surface)] px-3 py-2 text-xs font-semibold text-[var(--site-text)]">
                {data.currentModuleLabel}
              </div>
            ) : null}
            {data.nextStepLabel ? (
              <div className="rounded-full bg-[var(--site-primary-soft)] px-3 py-2 text-xs font-semibold text-[var(--site-primary)]">
                {data.nextStepLabel}
              </div>
            ) : null}
            {data.checkpointPending ? (
              <div className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                Checkpoint comes next
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="mt-3 grid gap-3">
          <SectionList title="Plan steps" items={data.steps} />
          <SectionList title="Check for understanding" items={data.checkForUnderstanding} />
        </div>
      </div>
    );
  }

  if (data.type === 'quiz') {
    return (
      <div className="mt-3 rounded-[1.25rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
          Quick quiz
        </div>
        {data.progressNote ? (
          <div className="mt-3 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm leading-6 text-[var(--site-muted)]">
            {data.progressNote}
          </div>
        ) : null}
        {data.currentModuleLabel || data.nextStepLabel || data.checkpointPending ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.currentModuleLabel ? (
              <div className="rounded-full bg-[var(--site-surface)] px-3 py-2 text-xs font-semibold text-[var(--site-text)]">
                {data.currentModuleLabel}
              </div>
            ) : null}
            {data.nextStepLabel ? (
              <div className="rounded-full bg-[var(--site-primary-soft)] px-3 py-2 text-xs font-semibold text-[var(--site-primary)]">
                {data.nextStepLabel}
              </div>
            ) : null}
            {data.checkpointPending ? (
              <div className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                Checkpoint-focused quiz
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="mt-3">
          <SectionList title="Questions" items={data.questions} />
        </div>
        {data.answerPrompt ? (
          <div className="mt-3 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm leading-6 text-[var(--site-muted)]">
            {data.answerPrompt}
          </div>
        ) : null}
        {onApplyPrompt ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onApplyPrompt({
                  mode: 'check_my_answer',
                  text: buildQuizAnswerTemplate(data.questions),
                })
              }
              className="rounded-full bg-[var(--site-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--site-primary-strong)]"
            >
              Answer this quiz
            </button>
            <button
              type="button"
              onClick={() =>
                onApplyPrompt({
                  mode: 'quiz_me',
                  text: 'Give me another short quiz on this topic.',
                })
              }
              className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)] hover:text-[var(--site-primary)]"
            >
              Another quiz
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (data.type === 'explain_wrong_answer') {
    return (
      <div className="mt-3 rounded-[1.25rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
            Why this answer missed
          </div>
          {data.verdict ? (
            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${verdictTone(data.verdict)}`}>
              {data.verdict}
            </div>
          ) : null}
        </div>
        {data.progressNote ? (
          <div className="mt-3 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm leading-6 text-[var(--site-muted)]">
            {data.progressNote}
          </div>
        ) : null}
        {data.currentModuleLabel || data.nextStepLabel || data.checkpointPending ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.currentModuleLabel ? (
              <div className="rounded-full bg-[var(--site-surface)] px-3 py-2 text-xs font-semibold text-[var(--site-text)]">
                {data.currentModuleLabel}
              </div>
            ) : null}
            {data.nextStepLabel ? (
              <div className="rounded-full bg-[var(--site-primary-soft)] px-3 py-2 text-xs font-semibold text-[var(--site-primary)]">
                {data.nextStepLabel}
              </div>
            ) : null}
            {data.checkpointPending ? (
              <div className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                Review before checkpoint
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="mt-3 grid gap-3">
          <SectionList title="Why this answer misses" items={data.whyWrong} />
          {data.correctAnswer ? (
            <div className="rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
                Correct answer
              </div>
              <div className="mt-3 text-sm leading-6 text-[var(--site-text)]">{data.correctAnswer}</div>
            </div>
          ) : null}
          <SectionList title="Memory tip" items={data.memoryTips} />
          <SectionList title="What to try next" items={data.nextTry} />
        </div>
        {onApplyPrompt ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={() =>
                onApplyPrompt({
                  mode: 'quiz_me',
                  text: 'Give me one more question on this same idea so I can try again.',
                })
              }
              className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)] hover:text-[var(--site-primary)]"
            >
              Practice again
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-[1.25rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
          Answer review
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {data.confidenceLabel ? (
            <div
              className={`rounded-full px-3 py-1 text-xs font-semibold ${confidenceTone(data.confidenceScore)}`}
            >
              {data.confidenceLabel}
              {data.confidenceScore !== null ? ` (${data.confidenceScore}%)` : ''}
            </div>
          ) : null}
          {data.verdict ? (
            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${verdictTone(data.verdict)}`}>
              {data.verdict}
            </div>
          ) : null}
        </div>
      </div>
      {data.progressNote ? (
        <div className="mt-3 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm leading-6 text-[var(--site-muted)]">
          {data.progressNote}
        </div>
      ) : null}
      {data.currentModuleLabel || data.nextStepLabel || data.checkpointPending ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {data.currentModuleLabel ? (
            <div className="rounded-full bg-[var(--site-surface)] px-3 py-2 text-xs font-semibold text-[var(--site-text)]">
              {data.currentModuleLabel}
            </div>
          ) : null}
          {data.nextStepLabel ? (
            <div className="rounded-full bg-[var(--site-primary-soft)] px-3 py-2 text-xs font-semibold text-[var(--site-primary)]">
              {data.nextStepLabel}
            </div>
          ) : null}
          {data.checkpointPending ? (
            <div className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
              Review before checkpoint
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="mt-3 grid gap-3">
        <SectionList title="What is correct" items={data.correct} />
        <SectionList title="What is missing" items={data.missing} />
        <SectionList title="How to improve" items={data.improve} />
      </div>
      {onApplyPrompt ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() =>
              onApplyPrompt({
                mode: 'quiz_me',
                text: 'Give me another short quiz so I can check if I improved.',
              })
            }
            className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)] hover:text-[var(--site-primary)]"
          >
            Practice again
          </button>
        </div>
      ) : null}
    </div>
  );
}
