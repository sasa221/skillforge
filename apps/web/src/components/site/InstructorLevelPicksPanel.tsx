'use client';

import Link from 'next/link';
import { ArrowRight, Clock3, Sparkles } from 'lucide-react';

import { headingFont } from '@/lib/fonts';
import type { PublicInstructorCourse } from '@/lib/content/types';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  description: string;
  picks: Array<{
    label: string;
    reason: string;
    course: PublicInstructorCourse;
  }>;
  courseHrefBuilder?: (slug: string) => string;
  ctaLabel?: string;
  compact?: boolean;
  className?: string;
};

export function InstructorLevelPicksPanel({
  title,
  description,
  picks,
  courseHrefBuilder = (slug) => `/courses/${slug}`,
  ctaLabel = 'Open course',
  compact = false,
  className,
}: Props) {
  if (!picks.length) return null;

  return (
    <div
      className={cn(
        'rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] shadow-[0_22px_48px_var(--site-shadow)]',
        compact ? 'p-5' : 'p-6',
        className,
      )}
    >
      <div className="max-w-[760px]">
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary-soft)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--site-primary)]">
          <Sparkles className="h-3.5 w-3.5" />
          Pick your level
        </div>
        <h2
          className={cn(
            'mt-4 font-extrabold tracking-[-0.04em] text-[var(--site-text)]',
            compact ? 'text-2xl' : 'text-3xl',
            headingFont.className,
          )}
        >
          {title}
        </h2>
        <p className="mt-3 text-base leading-7 text-[var(--site-muted)]">{description}</p>
      </div>

      <div className={cn('mt-6 grid gap-4', compact ? 'md:grid-cols-1' : 'lg:grid-cols-3')}>
        {picks.map((pick) => (
          <div
            key={`${pick.label}-${pick.course.id}`}
            className="rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-[var(--site-primary-soft)] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--site-primary)]">
                {pick.label}
              </span>
              <span className="rounded-full bg-[var(--site-surface)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)] capitalize">
                {pick.course.difficulty}
              </span>
            </div>

            <div className="mt-4 text-xl font-semibold leading-tight text-[var(--site-text)]">
              {pick.course.title}
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">{pick.reason}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--site-surface)] px-3 py-2 text-[var(--site-text)]">
                <Clock3 className="h-3.5 w-3.5 text-[var(--site-primary)]" />
                {formatCourseTime(pick.course.estimatedMinutes)}
              </span>
              {pick.course.skills[0] ? (
                <span className="rounded-full bg-[var(--site-surface)] px-3 py-2 text-[var(--site-text)]">
                  {pick.course.skills[0].skill.title}
                </span>
              ) : null}
            </div>

            <Link
              href={courseHrefBuilder(pick.course.slug)}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)]"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatCourseTime(minutes: number | null) {
  if (!minutes || minutes <= 0) return 'Self paced';
  const hours = Math.max(1, Math.round(minutes / 60));
  return `${hours}h guided time`;
}
