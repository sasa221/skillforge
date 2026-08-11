'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Compass,
  Layers3,
  Sparkles,
  Target,
} from 'lucide-react';

import { PublicShell } from '@/components/site/PublicShell';
import { learningPathsApi } from '@/lib/api/endpoints';
import { headingFont } from '@/lib/fonts';
import { cn } from '@/lib/utils';

function formatHours(totalMinutes: number) {
  if (totalMinutes <= 0) return 'Fresh path';
  const hours = totalMinutes / 60;
  return hours >= 10 ? `${Math.round(hours)}h guided` : `${hours.toFixed(1)}h guided`;
}

function difficultyTone(difficulty: string) {
  switch (difficulty) {
    case 'advanced':
      return 'bg-[var(--site-warm-soft)] text-[var(--site-warm)]';
    case 'intermediate':
      return 'bg-[var(--site-primary-soft)] text-[var(--site-primary)]';
    default:
      return 'bg-[var(--site-success-soft)] text-[var(--site-success)]';
  }
}

import { SkillTree3DScene } from '@/components/3d/SkillTree3DScene';

export default function LearningPathPage() {
  const pathsQuery = useQuery({
    queryKey: ['public', 'learning-paths'],
    queryFn: learningPathsApi.list,
    staleTime: 60_000,
  });
  const paths = pathsQuery.data ?? [];
  const featured = paths[0] ?? null;
  const remaining = paths.slice(1);

  return (
    <PublicShell>
      <main className="bg-[radial-gradient(circle_at_top,var(--site-primary-soft),transparent_26%),var(--site-bg)] transition-colors">
        <section className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary-soft)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--site-primary)]">
                <Compass className="h-3.5 w-3.5" />
                Database-driven learning paths
              </div>

              <div className="space-y-4">
                <h1
                  className={cn(
                    'max-w-[760px] text-4xl font-extrabold leading-[0.95] tracking-[-0.05em] text-[var(--site-text)] md:text-6xl',
                    headingFont.className,
                  )}
                >
                  Follow a guided path instead of guessing what to study next
                </h1>
                <p className="max-w-[760px] text-lg leading-8 text-[var(--site-muted)]">
                  Every path here is built from published courses in your database, ordered into a
                  clean sequence so learners can move from basics to stronger project-ready skills.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <MetricCard
                  label="Published paths"
                  value={pathsQuery.isLoading ? '...' : String(paths.length)}
                  helper="Ready for learners right now"
                />
                <MetricCard
                  label="Courses mapped"
                  value={
                    pathsQuery.isLoading
                      ? '...'
                      : String(paths.reduce((sum, path) => sum + path.courseCount, 0))
                  }
                  helper="Pulled from live catalog data"
                />
                <MetricCard
                  label="Skills covered"
                  value={pathsQuery.isLoading ? '...' : String(featured?.coveredSkills ?? 0)}
                  helper="Across the featured path"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={featured?.courses[0] ? `/courses/${featured.courses[0].slug}` : '/courses'}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)]"
                >
                  Start the path
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/courses"
                  className="inline-flex items-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-5 py-3 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-alt)]"
                >
                  Browse all courses
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_30px_60px_var(--site-shadow)]">
              {pathsQuery.isLoading ? (
                <div className="space-y-4">
                  <div className="h-7 w-36 animate-pulse rounded-full bg-[var(--site-surface-alt)]" />
                  <div className="h-10 w-3/4 animate-pulse rounded-2xl bg-[var(--site-surface-alt)]" />
                  <div className="h-20 animate-pulse rounded-[1.5rem] bg-[var(--site-surface-alt)]" />
                  <div className="grid gap-3">
                    {[0, 1, 2].map((item) => (
                      <div
                        key={item}
                        className="h-28 animate-pulse rounded-[1.5rem] bg-[var(--site-surface-alt)]"
                      />
                    ))}
                  </div>
                </div>
              ) : pathsQuery.isError ? (
                <div className="rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-6 text-sm leading-7 text-[var(--site-muted)]">
                  We could not load the learning paths right now. Try refreshing in a moment.
                </div>
              ) : featured ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-[var(--site-success-soft)] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--site-success)]">
                        <Sparkles className="h-3.5 w-3.5" />
                        {featured.isFallback ? 'Adaptive starter path' : 'Featured path'}
                      </div>
                      <h2 className="mt-4 text-3xl font-extrabold text-[var(--site-text)]">
                        {featured.title}
                      </h2>
                      <p className="mt-3 max-w-[500px] text-sm leading-7 text-[var(--site-muted)]">
                        {featured.description ??
                          'A curated sequence designed to keep the next course obvious and momentum high.'}
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3 text-right">
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--site-subtle)]">
                        Path stats
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-[var(--site-text)]">
                        {featured.courseCount} courses
                      </div>
                      <div className="text-sm text-[var(--site-muted)]">{formatHours(featured.totalMinutes)}</div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3">
                    {featured.courses.slice(0, 4).map((course, index) => (
                      <div
                        key={course.id}
                        className="rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--site-subtle)]">
                              <Target className="h-3.5 w-3.5 text-[var(--site-primary)]" />
                              Step {String(index + 1).padStart(2, '0')}
                            </div>
                            <div className="mt-2 text-lg font-bold text-[var(--site-text)]">{course.title}</div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                              <span className={cn('rounded-full px-3 py-1', difficultyTone(course.difficulty))}>
                                {course.difficulty}
                              </span>
                              <span className="rounded-full bg-[var(--site-primary-soft)] px-3 py-1 text-[var(--site-primary)]">
                                {course.lessonCount} lessons
                              </span>
                              <span className="rounded-full bg-[var(--site-surface)] px-3 py-1 text-[var(--site-subtle)]">
                                {course.moduleCount} modules
                              </span>
                            </div>
                          </div>
                          <Link
                            href={`/courses/${course.slug}`}
                            className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2 text-xs font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)] hover:text-[var(--site-primary)]"
                          >
                            Open course
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-6 text-sm leading-7 text-[var(--site-muted)]">
                  No published learning paths are available yet. Publish a few courses and this page
                  will automatically assemble the first starter path from live catalog data.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
          <SkillTree3DScene />
        </section>

        {featured ? (
          <section className="mx-auto w-full max-w-[1180px] px-4 pb-14 sm:px-6 lg:px-8 lg:pb-24">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-8 shadow-[0_24px_50px_var(--site-shadow)]">
                <div className="text-sm font-extrabold uppercase tracking-[0.24em] text-[var(--site-subtle)]">
                  Full path breakdown
                </div>
                <div className="mt-6 space-y-4">
                  {featured.courses.map((course, index) => (
                    <div
                      key={course.id}
                      className="rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 py-5"
                    >
                      <div className="flex flex-wrap items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--site-primary-soft)] text-sm font-extrabold text-[var(--site-primary)]">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-xl font-bold text-[var(--site-text)]">{course.title}</div>
                            <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', difficultyTone(course.difficulty))}>
                              {course.difficulty}
                            </span>
                          </div>
                          {course.description ? (
                            <p className="mt-2 text-sm leading-7 text-[var(--site-muted)]">{course.description}</p>
                          ) : null}
                          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--site-surface)] px-3 py-1 text-[var(--site-subtle)]">
                              <Layers3 className="h-3.5 w-3.5" />
                              {course.moduleCount} modules
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--site-surface)] px-3 py-1 text-[var(--site-subtle)]">
                              <BookOpen className="h-3.5 w-3.5" />
                              {course.lessonCount} lessons
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--site-surface)] px-3 py-1 text-[var(--site-subtle)]">
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatHours(course.estimatedMinutes ?? 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-8 shadow-[0_24px_50px_var(--site-shadow)]">
                  <div className="text-sm font-extrabold uppercase tracking-[0.24em] text-[var(--site-subtle)]">
                    Why this path works
                  </div>
                  <div className="mt-6 grid gap-4">
                    <InsightCard
                      title="Keeps sequencing obvious"
                      body="Learners always know which course should come first, which one deepens the skill, and what to open next."
                    />
                    <InsightCard
                      title="Stays tied to live catalog data"
                      body="The cards on this page are assembled from published course records, not static frontend placeholders."
                    />
                    <InsightCard
                      title="Ready for admin curation"
                      body="You can keep the fallback path today, then start curating named paths directly from the database."
                    />
                  </div>
                </div>

                {remaining.length > 0 ? (
                  <div className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-8 shadow-[0_24px_50px_var(--site-shadow)]">
                    <div className="text-sm font-extrabold uppercase tracking-[0.24em] text-[var(--site-subtle)]">
                      More published paths
                    </div>
                    <div className="mt-5 space-y-3">
                      {remaining.map((path) => (
                        <div
                          key={path.id}
                          className="rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-4"
                        >
                          <div className="text-lg font-bold text-[var(--site-text)]">{path.title}</div>
                          <div className="mt-1 text-sm text-[var(--site-muted)]">
                            {path.courseCount} courses, {path.totalLessons} lessons, {path.coveredSkills} skills
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </PublicShell>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 shadow-[0_18px_36px_var(--site-shadow)]">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--site-subtle)]">
        {label}
      </div>
      <div className="mt-3 text-3xl font-extrabold text-[var(--site-text)]">{value}</div>
      <div className="mt-2 text-sm leading-7 text-[var(--site-muted)]">{helper}</div>
    </div>
  );
}

function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5">
      <div className="text-lg font-bold text-[var(--site-text)]">{title}</div>
      <div className="mt-2 text-sm leading-7 text-[var(--site-muted)]">{body}</div>
    </div>
  );
}
