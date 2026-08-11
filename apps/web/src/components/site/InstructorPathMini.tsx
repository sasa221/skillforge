import Link from 'next/link';
import { ArrowRight, Rocket, Route } from 'lucide-react';

import {
  pickNextInstructorCourse,
  pickStartingInstructorCourse,
} from '@/lib/content/instructor-course-picks';
import type { PublicInstructorCourse } from '@/lib/content/types';

export function InstructorPathMini({
  courses,
  anchorCourse,
}: {
  courses: PublicInstructorCourse[];
  anchorCourse?: PublicInstructorCourse | null;
}) {
  const startCourse = pickStartingInstructorCourse(courses);
  const nextCourse = pickNextInstructorCourse(courses, anchorCourse ?? startCourse);

  if (!startCourse && !nextCourse) {
    return null;
  }

  return (
    <div className="rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-4 shadow-[0_16px_32px_var(--site-shadow)]">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--site-subtle)]">
        Best route with this instructor
      </div>

      <div className="mt-4 space-y-3">
        {startCourse ? (
          <PathLink
            href={`/courses/${startCourse.slug}`}
            icon={Route}
            label="Start here"
            title={startCourse.title}
          />
        ) : null}

        {nextCourse && nextCourse.id !== startCourse?.id ? (
          <PathLink
            href={`/courses/${nextCourse.slug}`}
            icon={Rocket}
            label="Next step"
            title={nextCourse.title}
          />
        ) : null}
      </div>
    </div>
  );
}

function PathLink({
  href,
  icon: Icon,
  label,
  title,
}: {
  href: string;
  icon: typeof Route;
  label: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3 transition hover:bg-[var(--site-primary-soft)]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--site-surface)] text-[var(--site-primary)] shadow-[0_10px_20px_var(--site-shadow)]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
            {label}
          </span>
          <span className="mt-1 block truncate text-sm font-semibold text-[var(--site-text)]">
            {title}
          </span>
        </span>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--site-primary)]" />
    </Link>
  );
}
