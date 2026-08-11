import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpenCheck } from 'lucide-react';

import { CourseInstructorSpotlight } from '@/components/site/CourseInstructorSpotlight';
import { resolveMediaUrl } from '@/lib/content/media';
import type { Instructor, MediaAsset } from '@/lib/content/types';

type ContinueLesson = {
  slug: string;
  title: string;
  moduleTitle: string | null;
  moduleOrder: number | null;
  checkpointPending: boolean;
  courseSlug: string;
  courseTitle: string;
  courseCoverImageUrl: string | null;
  courseCoverImageAsset: MediaAsset | null;
  instructor: Instructor | null;
};

type Props = {
  continueLesson: ContinueLesson | null | undefined;
  isLoading: boolean;
};

export function ContinueLearningCard({ continueLesson, isLoading }: Props) {
  const coverUrl = continueLesson
    ? resolveMediaUrl(continueLesson.courseCoverImageAsset, continueLesson.courseCoverImageUrl)
    : null;

  return (
    <div className="relative overflow-hidden rounded-[1.8rem] border border-[var(--site-border)] bg-[radial-gradient(circle_at_top_right,var(--site-primary-soft),transparent_30%),var(--site-surface)] shadow-[0_18px_40px_var(--site-shadow)]">
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[var(--site-primary-soft)] blur-2xl" />
      <div className="relative flex flex-col gap-4 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
            <BookOpenCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--site-subtle)]">
              Continue learning
            </div>
            <div className="mt-1 text-xl font-semibold text-[var(--site-text)]">Pick up where you left off</div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-5 w-1/2 rounded bg-[var(--site-bg-soft)]" />
            <div className="h-20 rounded-[1.2rem] bg-[var(--site-bg-soft)]" />
          </div>
        ) : continueLesson ? (
          <>
            <div className="overflow-hidden rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]">
              {coverUrl ? (
                <div className="relative h-40 w-full overflow-hidden border-b border-[var(--site-border)] bg-[var(--site-bg-soft)]">
                  <img
                    src={coverUrl}
                    alt={continueLesson.courseTitle}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,transparent,rgba(10,22,48,0.55))]" />
                </div>
              ) : null}

              <div className="space-y-4 p-4">
                <div>
                  <div className="text-sm text-[var(--site-muted)]">Up next in {continueLesson.courseTitle}</div>
                  <div className="mt-2 text-xl font-semibold text-[var(--site-text)]">{continueLesson.title}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {continueLesson.moduleTitle ? (
                      <span className="rounded-full bg-[var(--site-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--site-primary)]">
                        {continueLesson.moduleOrder ? `Module ${continueLesson.moduleOrder}` : 'Current module'}: {continueLesson.moduleTitle}
                      </span>
                    ) : null}
                    {continueLesson.checkpointPending ? (
                      <span className="rounded-full bg-[var(--site-warm-soft)] px-3 py-1 text-xs font-semibold text-[var(--site-warm)]">
                        Checkpoint next
                      </span>
                    ) : null}
                  </div>
                </div>

                <CourseInstructorSpotlight
                  instructor={continueLesson.instructor}
                  compact
                  eyebrow="Your course guide"
                  title="Continue with instructor support"
                  description={`Stay inside ${continueLesson.courseTitle} and keep the next lesson grounded in the same teaching flow.`}
                  ctaHref={`/dashboard/courses/${continueLesson.courseSlug}`}
                  ctaLabel="Open course overview"
                />
              </div>
            </div>
            <Link
              href={`/dashboard/lessons/${continueLesson.slug}`}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--site-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_28px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)]"
            >
              Resume lesson
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4 text-sm leading-7 text-[var(--site-muted)]">
            Enroll in a course to unlock personalized continue-learning recommendations.
          </div>
        )}
      </div>
    </div>
  );
}
