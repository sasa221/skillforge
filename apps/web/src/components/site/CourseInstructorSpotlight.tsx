'use client';

import Link from 'next/link';

import type { Instructor } from '@/lib/content/types';
import { resolveInstructorAvatarUrl } from '@/lib/content/media';
import { cn } from '@/lib/utils';

type Props = {
  instructor: Instructor | null | undefined;
  eyebrow?: string;
  title?: string;
  description?: string | null;
  ctaHref?: string;
  ctaLabel?: string;
  compact?: boolean;
  className?: string;
  disableProfileLink?: boolean;
};

export function CourseInstructorSpotlight({
  instructor,
  eyebrow = 'Course guide',
  title = 'Meet your instructor',
  description,
  ctaHref,
  ctaLabel,
  compact = false,
  className,
  disableProfileLink = false,
}: Props) {
  if (!instructor) return null;

  const avatarUrl = resolveInstructorAvatarUrl(instructor);
  const profileHref = !disableProfileLink && instructor.slug ? `/instructors/${instructor.slug}` : null;
  const copy =
    description ??
    instructor.bio ??
    'Your instructor shapes the pacing, examples, and explanations used throughout this learning path.';
  const resolvedCtaHref = ctaHref ?? profileHref ?? undefined;
  const resolvedCtaLabel = ctaLabel ?? (resolvedCtaHref ? 'Open profile' : undefined);

  return (
    <div
      className={cn(
        'rounded-[1.7rem] border border-[var(--site-border)] bg-[var(--site-surface)] shadow-[0_18px_36px_var(--site-shadow)]',
        compact ? 'p-4' : 'p-5',
        className,
      )}
    >
      <div className={cn('flex gap-4', compact ? 'items-start' : 'items-start')}>
        {profileHref ? (
          <Link
            href={profileHref}
            aria-label={`Open instructor profile for ${instructor.fullName}`}
            className="shrink-0 rounded-[1.2rem] transition hover:opacity-90"
          >
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.2rem] bg-[var(--site-primary-soft)] text-sm font-semibold text-[var(--site-primary)]">
              {avatarUrl ? (
                <img src={avatarUrl} alt={instructor.fullName} className="h-full w-full object-cover" />
              ) : (
                getInitials(instructor.fullName)
              )}
            </div>
          </Link>
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[1.2rem] bg-[var(--site-primary-soft)] text-sm font-semibold text-[var(--site-primary)]">
            {avatarUrl ? (
              <img src={avatarUrl} alt={instructor.fullName} className="h-full w-full object-cover" />
            ) : (
              getInitials(instructor.fullName)
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--site-subtle)]">
            {eyebrow}
          </div>
          <div className={cn('mt-2 font-bold text-[var(--site-text)]', compact ? 'text-lg' : 'text-xl')}>
            {title}
          </div>

          <div className="mt-3">
            {profileHref ? (
              <Link
                href={profileHref}
                className="text-base font-semibold text-[var(--site-text)] transition hover:text-[var(--site-primary)]"
              >
                {instructor.fullName}
              </Link>
            ) : (
              <div className="text-base font-semibold text-[var(--site-text)]">{instructor.fullName}</div>
            )}
            <div className="mt-1 text-sm text-[var(--site-primary)]">
              {instructor.title ?? 'Course instructor'}
            </div>
          </div>

          <p className={cn('mt-3 text-sm leading-7 text-[var(--site-muted)]', compact && 'line-clamp-3')}>
            {copy}
          </p>

          {resolvedCtaHref && resolvedCtaLabel ? (
            <Link
              href={resolvedCtaHref}
              className="mt-4 inline-flex rounded-full border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
            >
              {resolvedCtaLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function getInitials(input: string) {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
