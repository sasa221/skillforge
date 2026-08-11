'use client';

import type { AiSourceReference } from '@/lib/content/types';

export function AiSourceChips({
  label = 'Latest answer grounded in',
  sources,
}: {
  label?: string;
  sources: AiSourceReference[];
}) {
  if (!sources.length) return null;

  return (
    <div className="mt-3 rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
        {label}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {sources.map((source) => (
          <div
            key={source.id}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-3 py-1.5 text-xs text-[var(--site-muted)]"
          >
            <span className="rounded-full bg-[var(--site-primary-soft)] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--site-primary)]">
              {source.kind}
            </span>
            <span className="font-medium text-[var(--site-text)]">{source.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
