'use client';

import type { AiSourceReference } from '@/lib/content/types';

export function AiGroundingPanel({
  title,
  sources,
}: {
  title: string;
  sources: AiSourceReference[];
}) {
  if (!sources.length) return null;

  return (
    <div className="mt-5 rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
      <div className="text-sm font-semibold text-[var(--site-text)]">{title}</div>
      <div className="mt-3 grid gap-3">
        {sources.map((source) => (
          <div
            key={source.id}
            className="rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--site-primary-soft)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--site-primary)]">
                {source.kind}
              </span>
              <div className="text-sm font-semibold text-[var(--site-text)]">{source.title}</div>
            </div>
            {source.subtitle ? (
              <div className="mt-1 text-xs font-medium text-[var(--site-subtle)]">{source.subtitle}</div>
            ) : null}
            {source.snippet ? (
              <div className="mt-2 text-sm leading-6 text-[var(--site-muted)]">{source.snippet}</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
