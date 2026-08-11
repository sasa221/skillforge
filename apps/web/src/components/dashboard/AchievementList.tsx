import * as React from 'react';
import { Award } from 'lucide-react';

type Badge = { key: string; title: string; description: string | null; awardedAt: string };

type Props = {
  badges: Badge[] | undefined;
  isLoading: boolean;
};

export function AchievementList({ badges, isLoading }: Props) {
  return (
    <div className="rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_40px_var(--site-shadow)]">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-warm-soft)] text-[var(--site-warm)]">
          <Award className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
            Recent achievements
          </div>
          <div className="mt-1 text-xl font-semibold text-[var(--site-text)]">Latest badges and wins</div>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          <div className="h-20 rounded-[1rem] bg-[var(--site-bg-soft)]" />
          <div className="h-20 rounded-[1rem] bg-[var(--site-bg-soft)]" />
        </div>
      ) : !badges || badges.length === 0 ? (
        <div className="mt-5 rounded-[1.4rem] border border-dashed border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4 text-sm leading-7 text-[var(--site-muted)]">
          No badges yet. Complete a lesson or quiz to start earning achievements.
        </div>
      ) : (
        <ul className="mt-5 space-y-3 text-sm">
          {badges.map((badge) => (
            <li
              key={badge.key}
              className="flex items-center justify-between gap-3 rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3"
            >
              <div>
                <div className="font-medium text-[var(--site-text)]">{badge.title}</div>
                {badge.description ? (
                  <div className="text-xs text-[var(--site-muted)]">{badge.description}</div>
                ) : null}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wide text-[var(--site-primary)]">
                {badge.key}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
