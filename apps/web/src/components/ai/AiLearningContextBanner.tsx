'use client';

import type { AiLearningContext } from '@/lib/content/types';

export function AiLearningContextBanner({
  context,
}: {
  context: AiLearningContext | null;
}) {
  if (!context) return null;

  return (
    <div className="mt-5 rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
        Ready for this session
      </div>
      {context.progressNote ? (
        <div className="mt-3 rounded-[1rem] bg-[var(--site-surface)] px-4 py-3 text-sm leading-6 text-[var(--site-muted)]">
          {context.progressNote}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {context.currentModuleLabel ? (
          <div className="rounded-full bg-[var(--site-surface)] px-3 py-2 text-xs font-semibold text-[var(--site-text)]">
            {context.currentModuleLabel}
          </div>
        ) : null}
        {context.currentLessonLabel ? (
          <div className="rounded-full bg-[var(--site-primary-soft)] px-3 py-2 text-xs font-semibold text-[var(--site-primary)]">
            {context.currentLessonLabel}
          </div>
        ) : null}
        {context.nextStepLabel ? (
          <div className="rounded-full bg-[var(--site-primary-soft)] px-3 py-2 text-xs font-semibold text-[var(--site-primary)]">
            {context.nextStepLabel}
          </div>
        ) : null}
        {context.checkpointPending ? (
          <div className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
            Checkpoint coming up
          </div>
        ) : null}
      </div>
    </div>
  );
}
