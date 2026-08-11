import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Clock3,
  GraduationCap,
  Layers3,
  Route,
  Sparkles,
} from 'lucide-react';

import { CourseArtwork } from '@/components/site/CourseArtwork';
import { CourseInstructorSpotlight } from '@/components/site/CourseInstructorSpotlight';
import { InstructorLevelPicksPanel } from '@/components/site/InstructorLevelPicksPanel';
import { PublicShell } from '@/components/site/PublicShell';
import { apiGet } from '@/lib/api';
import {
  buildInstructorLevelPicks,
  pickNextInstructorCourse,
  pickStartingInstructorCourse,
} from '@/lib/content/instructor-course-picks';
import { resolveCourseCoverUrl } from '@/lib/content/media';
import { headingFont } from '@/lib/fonts';
import type { PublicInstructorProfile } from '@/lib/content/types';
import { cn } from '@/lib/utils';

export default async function InstructorDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const instructor = await getPublishedInstructorBySlug(slug);

  if (!instructor) {
    notFound();
  }

  const startCourse = pickStartingCourse(instructor.courses);
  const teachingPath = buildTeachingPath(instructor.courses);
  const recommendedPicks = buildRecommendedPicks(instructor.courses);
  const levelPicks = buildInstructorLevelPicks(instructor.courses, startCourse);

  return (
    <PublicShell>
      <main className="bg-[radial-gradient(circle_at_top,var(--site-primary-soft),transparent_24%),linear-gradient(180deg,var(--site-bg-soft)_0%,var(--site-bg)_56%,var(--site-bg-soft)_100%)]">
        <section className="mx-auto w-full max-w-[1180px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <Link
            href="/instructors"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-alt)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to instructors
          </Link>

          <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_320px] xl:items-start">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary-soft)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--site-primary)]">
                <Sparkles className="h-3.5 w-3.5" />
                Instructor profile
              </div>

              <div className="space-y-5">
                <h1
                  className={cn(
                    'max-w-[760px] text-5xl font-extrabold leading-[0.98] tracking-[-0.05em] text-[var(--site-text)] sm:text-6xl',
                    headingFont.className,
                  )}
                >
                  Learn with {instructor.fullName}
                </h1>
                <p className="max-w-[760px] text-lg leading-8 text-[var(--site-muted)]">
                  {instructor.bio ??
                    `${instructor.fullName} helps learners move through practical courses with clearer pacing, grounded examples, and focused checkpoints.`}
                </p>
              </div>

              <CourseInstructorSpotlight
                instructor={instructor}
                eyebrow="Teaching profile"
                title={instructor.title ?? 'Course instructor'}
                description={
                  instructor.bio ??
                  `${instructor.fullName} teaches through guided course work, examples, and checkpoints built for steady progress.`
                }
                disableProfileLink
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <InstructorStat
                  icon={BookOpenText}
                  label="Published courses"
                  value={String(instructor.stats.publishedCourses)}
                />
                <InstructorStat
                  icon={GraduationCap}
                  label="Guided hours"
                  value={`${instructor.stats.guidedHours}h`}
                />
                <InstructorStat
                  icon={Layers3}
                  label="Covered skills"
                  value={String(instructor.stats.coveredSkills)}
                />
              </div>

              {instructor.focusSkills.length > 0 ? (
                <div className="rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 shadow-[0_18px_40px_var(--site-shadow)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--site-subtle)]">
                    Focus skills
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {instructor.focusSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-[var(--site-primary-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-primary)]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_22px_48px_var(--site-shadow)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--site-subtle)]">
                Quick summary
              </div>
              <div className="mt-4 space-y-3">
                <SummaryPill
                  label="Primary title"
                  value={instructor.title ?? 'Course instructor'}
                />
                <SummaryPill
                  label="Course coverage"
                  value={`${instructor.stats.publishedCourses} live course${instructor.stats.publishedCourses === 1 ? '' : 's'}`}
                />
                <SummaryPill
                  label="Skill range"
                  value={`${instructor.stats.coveredSkills} tracked skill${instructor.stats.coveredSkills === 1 ? '' : 's'}`}
                />
              </div>

              {startCourse ? (
                <div className="mt-5 rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--site-subtle)]">
                    Start here
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[var(--site-text)]">
                    {startCourse.title}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[var(--site-muted)]">
                    {startCourse.description ??
                      `Begin with ${startCourse.title} to learn through the clearest entry point in ${instructor.fullName}'s teaching path.`}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
                    <span className="rounded-full bg-[var(--site-surface)] px-3 py-2 capitalize text-[var(--site-text)]">
                      {startCourse.difficulty}
                    </span>
                    <span className="rounded-full bg-[var(--site-surface)] px-3 py-2 text-[var(--site-text)]">
                      {formatCourseTime(startCourse.estimatedMinutes)}
                    </span>
                  </div>
                  <Link
                    href={`/courses/${startCourse.slug}`}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)]"
                  >
                    Begin with this course
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : null}

              <Link
                href="/courses"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)]"
              >
                Browse all courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {teachingPath.length > 1 ? (
          <section className="mx-auto w-full max-w-[1180px] px-4 pb-6 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_22px_48px_var(--site-shadow)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary-soft)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--site-primary)]">
                    <Route className="h-3.5 w-3.5" />
                    Teaching path
                  </div>
                  <h2
                    className={cn(
                      'mt-4 text-3xl font-extrabold tracking-[-0.04em] text-[var(--site-text)]',
                      headingFont.className,
                    )}
                  >
                    A clear path through {instructor.fullName}&apos;s courses
                  </h2>
                  <p className="mt-3 max-w-[720px] text-base leading-7 text-[var(--site-muted)]">
                    If you want to follow one instructor through multiple topics, this is the cleanest order to start,
                    build momentum, and move into harder material.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {teachingPath.map((course, index) => (
                  <div
                    key={course.id}
                    className="rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--site-surface)] text-sm font-bold text-[var(--site-primary)] shadow-[0_10px_24px_var(--site-shadow)]">
                        {index + 1}
                      </span>
                      <span className="rounded-full bg-[var(--site-surface)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)] capitalize">
                        {course.difficulty}
                      </span>
                    </div>

                    <div className="mt-4 text-xl font-semibold leading-tight text-[var(--site-text)]">
                      {course.title}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
                      {course.description ??
                        'A guided course designed to keep progress steady through examples, checkpoints, and hands-on practice.'}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[var(--site-surface)] px-3 py-2 text-[var(--site-text)]">
                        <Clock3 className="h-3.5 w-3.5 text-[var(--site-primary)]" />
                        {formatCourseTime(course.estimatedMinutes)}
                      </span>
                      {course.skills[0] ? (
                        <span className="rounded-full bg-[var(--site-surface)] px-3 py-2 text-[var(--site-text)]">
                          {course.skills[0].skill.title}
                        </span>
                      ) : null}
                    </div>

                    <Link
                      href={`/courses/${course.slug}`}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)]"
                    >
                      Open course
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {recommendedPicks.length > 0 ? (
          <section className="mx-auto w-full max-w-[1180px] px-4 pb-6 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_22px_48px_var(--site-shadow)]">
              <div className="max-w-[760px]">
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary-soft)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--site-primary)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Recommended picks
                </div>
                <h2
                  className={cn(
                    'mt-4 text-3xl font-extrabold tracking-[-0.04em] text-[var(--site-text)]',
                    headingFont.className,
                  )}
                >
                  Choose the right course for where you are now
                </h2>
                <p className="mt-3 text-base leading-7 text-[var(--site-muted)]">
                  Whether you are just starting or ready for harder material, these picks help you
                  enter {instructor.fullName}&apos;s teaching path at the right level.
                </p>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {recommendedPicks.map((pick) => (
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
                      href={`/courses/${pick.course.slug}`}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)]"
                    >
                      Open course
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {levelPicks.length > 0 ? (
          <section className="mx-auto w-full max-w-[1180px] px-4 pb-6 sm:px-6 lg:px-8">
            <InstructorLevelPicksPanel
              title={`Choose the right entry point with ${instructor.fullName}`}
              description="Start at the level that fits you now, then keep moving through the same instructor's path with clearer next steps."
              picks={levelPicks}
            />
          </section>
        ) : null}

        <section className="mx-auto w-full max-w-[1180px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-extrabold uppercase tracking-[0.24em] text-[var(--site-subtle)]">
                Courses taught
              </div>
              <h2
                className={cn(
                  'mt-2 text-4xl font-extrabold tracking-[-0.04em] text-[var(--site-text)]',
                  headingFont.className,
                )}
              >
                Learn through {instructor.fullName}&apos;s course library
              </h2>
              <p className="mt-3 max-w-[700px] text-base leading-7 text-[var(--site-muted)]">
                Open any course below to study with the same teaching style, pacing, and practical examples.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {instructor.courses.map((course, index) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="group overflow-hidden rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface)] shadow-[0_22px_44px_var(--site-shadow)] transition hover:-translate-y-1 hover:shadow-[0_30px_56px_var(--site-shadow)]"
              >
                <CourseArtwork
                  index={index}
                  label={course.difficulty}
                  imageUrl={resolveCourseCoverUrl(course)}
                  imageAlt={course.title}
                  className="h-[230px] rounded-none rounded-t-[1.9rem]"
                />

                <div className="space-y-4 p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--site-subtle)]">
                    {course.estimatedMinutes && course.estimatedMinutes > 0
                      ? `${Math.max(1, Math.round(course.estimatedMinutes / 60))}h guided time`
                      : 'Self paced'}
                  </div>

                  <div>
                    <h3 className="text-[1.8rem] font-bold leading-tight text-[var(--site-text)]">
                      {course.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--site-muted)]">
                      {course.description ??
                        'A guided course path designed to move learners from fundamentals to confident execution.'}
                    </p>
                  </div>

                  {course.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {course.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill.id}
                          className="rounded-full bg-[var(--site-primary-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-primary)]"
                        >
                          {skill.skill.title}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between border-t border-[var(--site-border)] pt-4">
                    <span className="text-sm font-semibold capitalize text-[var(--site-muted)]">
                      {course.difficulty} course
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)]">
                      Open course
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}

function pickStartingCourse(courses: PublicInstructorProfile['courses']) {
  return pickStartingInstructorCourse(courses);
}

function buildTeachingPath(courses: PublicInstructorProfile['courses']) {
  const difficultyRank: Record<PublicInstructorProfile['courses'][number]['difficulty'], number> = {
    beginner: 0,
    intermediate: 1,
    advanced: 2,
  };

  return [...courses]
    .sort((left, right) => {
      const difficultyDelta = difficultyRank[left.difficulty] - difficultyRank[right.difficulty];
      if (difficultyDelta !== 0) return difficultyDelta;
      return left.title.localeCompare(right.title);
    })
    .slice(0, 3);
}

function buildRecommendedPicks(courses: PublicInstructorProfile['courses']) {
  if (!courses.length) return [];

  const picks: Array<{
    label: string;
    reason: string;
    course: PublicInstructorProfile['courses'][number];
  }> = [];
  const used = new Set<string>();

  const addPick = (
    label: string,
    reason: string,
    candidate: PublicInstructorProfile['courses'][number] | null | undefined,
  ) => {
    if (!candidate || used.has(candidate.id)) {
      return;
    }

    used.add(candidate.id);
    picks.push({ label, reason, course: candidate });
  };

  addPick(
    'Beginner friendly',
    'A clean starting point if you want the easiest path into this instructor’s teaching style.',
    pickStartingCourse(courses),
  );

  addPick(
    'Level up next',
    'Best if you already know the basics and want to move into more demanding practice.',
    pickCourseByDifficulty(courses, 'intermediate') ?? pickNextMostAdvancedCourse(courses, used),
  );

  addPick(
    'Deep dive',
    'Choose this when you want the hardest path, denser material, or a more advanced challenge.',
    pickCourseByDifficulty(courses, 'advanced') ?? pickNextMostAdvancedCourse(courses, used),
  );

  return picks;
}

function pickCourseByDifficulty(
  courses: PublicInstructorProfile['courses'],
  difficulty: PublicInstructorProfile['courses'][number]['difficulty'],
) {
  const matches = courses.filter((course) => course.difficulty === difficulty);
  if (!matches.length) return null;

  return [...matches].sort((left, right) => {
    const leftMinutes = left.estimatedMinutes ?? Number.MAX_SAFE_INTEGER;
    const rightMinutes = right.estimatedMinutes ?? Number.MAX_SAFE_INTEGER;
    if (leftMinutes !== rightMinutes) return leftMinutes - rightMinutes;
    return left.title.localeCompare(right.title);
  })[0];
}

function pickNextMostAdvancedCourse(
  courses: PublicInstructorProfile['courses'],
  used: Set<string>,
) {
  const difficultyRank: Record<PublicInstructorProfile['courses'][number]['difficulty'], number> = {
    beginner: 0,
    intermediate: 1,
    advanced: 2,
  };

  return [...courses]
    .filter((course) => !used.has(course.id))
    .sort((left, right) => {
      const difficultyDelta = difficultyRank[right.difficulty] - difficultyRank[left.difficulty];
      if (difficultyDelta !== 0) return difficultyDelta;
      const leftMinutes = left.estimatedMinutes ?? 0;
      const rightMinutes = right.estimatedMinutes ?? 0;
      if (leftMinutes !== rightMinutes) return rightMinutes - leftMinutes;
      return left.title.localeCompare(right.title);
    })[0];
}

function formatCourseTime(minutes: number | null) {
  if (!minutes || minutes <= 0) return 'Self paced';
  const hours = Math.max(1, Math.round(minutes / 60));
  return `${hours}h guided time`;
}

async function getPublishedInstructorBySlug(slug: string) {
  try {
    return await apiGet<PublicInstructorProfile>(`/instructors/${slug}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('API 404')) {
      return null;
    }

    throw error;
  }
}

function InstructorStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpenText;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-4 shadow-[0_14px_28px_var(--site-shadow)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--site-subtle)]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-[var(--site-text)]">{value}</div>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--site-subtle)]">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-[var(--site-text)]">{value}</div>
    </div>
  );
}
