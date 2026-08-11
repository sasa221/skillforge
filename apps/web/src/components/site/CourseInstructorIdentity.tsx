import Link from 'next/link';

import type { Instructor } from '@/lib/content/types';
import { resolveInstructorAvatarUrl } from '@/lib/content/media';
import { cn } from '@/lib/utils';

type Props = {
  instructor: Instructor | null | undefined;
  variant?: 'inline' | 'pill';
  className?: string;
  disableProfileLink?: boolean;
};

export function CourseInstructorIdentity({
  instructor,
  variant = 'inline',
  className,
  disableProfileLink = false,
}: Props) {
  if (!instructor) return null;

  const avatarUrl = resolveInstructorAvatarUrl(instructor);
  const profileHref = !disableProfileLink && instructor.slug ? `/instructors/${instructor.slug}` : null;
  const content = (
    <div
      className={cn(
        'flex items-center gap-3 text-sm text-[var(--site-muted)]',
        variant === 'pill' &&
          'w-fit rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2.5 shadow-[0_12px_24px_var(--site-shadow)]',
        profileHref && 'rounded-[1rem] transition hover:bg-[var(--site-surface-alt)] hover:text-[var(--site-text)]',
        className,
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--site-primary-soft)] text-xs font-semibold text-[var(--site-primary)]">
        {avatarUrl ? (
          <img src={avatarUrl} alt={instructor.fullName} className="h-full w-full object-cover" />
        ) : (
          getInitials(instructor.fullName)
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-[var(--site-text)]">{instructor.fullName}</span>
        <span className="block truncate text-[var(--site-subtle)]">{instructor.title ?? 'Course instructor'}</span>
      </span>
    </div>
  );

  if (!profileHref) return content;

  return (
    <Link
      href={profileHref}
      aria-label={`Open instructor profile for ${instructor.fullName}`}
      className="inline-flex"
    >
      {content}
    </Link>
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
