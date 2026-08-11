'use client';
import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { LessonDetail } from '@/lib/content/types';

type Props = {
  lesson: LessonDetail;
};

export function LessonNavigation({ lesson }: Props) {
  const { prev, next, siblings } = lesson.navigation;
  
  const currentIndex = siblings.findIndex((s) => s.slug === lesson.slug);
  const total = siblings.length;
  const positionText = `Lesson ${currentIndex >= 0 ? currentIndex + 1 : 1} of ${total}`;

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_40px_var(--site-shadow)]">
      {prev ? (
        <Link
          href={`/dashboard/lessons/${prev.slug}`}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-5 py-3 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-alt)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous Lesson
        </Link>
      ) : (
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 py-3 text-sm font-semibold text-[var(--site-text)] opacity-50 cursor-not-allowed">
          <ArrowLeft className="h-4 w-4" />
          Previous Lesson
        </span>
      )}

      <div className="text-sm font-medium text-[var(--site-muted)] text-center">
        {positionText}
      </div>

      {next ? (
        <Link
          href={`/dashboard/lessons/${next.slug}`}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)]"
        >
          Next Lesson
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 py-3 text-sm font-semibold text-[var(--site-text)] opacity-50 cursor-not-allowed">
          Next Lesson
          <ArrowRight className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
