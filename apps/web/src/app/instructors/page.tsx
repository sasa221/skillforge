import Link from 'next/link';
import { ArrowRight, BookOpenText, GraduationCap, Layers3 } from 'lucide-react';

import { CourseInstructorSpotlight } from '@/components/site/CourseInstructorSpotlight';
import { PublicShell } from '@/components/site/PublicShell';
import { apiGet } from '@/lib/api';
import {
  pickNextInstructorCourse,
  pickStartingInstructorCourse,
} from '@/lib/content/instructor-course-picks';
import { headingFont } from '@/lib/fonts';
import type { PublicInstructorProfile } from '@/lib/content/types';
import { cn } from '@/lib/utils';

export default async function InstructorsPage() {
  const instructors = await getPublishedInstructors();

  return (
    <PublicShell>
      <main className="bg-[radial-gradient(circle_at_top,var(--site-primary-soft),transparent_24%),linear-gradient(180deg,var(--site-bg-soft)_0%,var(--site-bg)_56%,var(--site-bg-soft)_100%)]">
        <section className="mx-auto w-full max-w-[1180px] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-[760px] space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary-soft)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--site-primary)]">
              Guided teaching team
            </div>
            <h1
              className={cn(
                'text-5xl font-extrabold leading-[0.98] tracking-[-0.05em] text-[var(--site-text)] sm:text-6xl',
                headingFont.className,
              )}
            >
              Meet the instructors behind the course library
            </h1>
            <p className="max-w-[700px] text-lg leading-8 text-[var(--site-muted)]">
              Explore the instructors shaping course pacing, examples, checkpoints, and study guidance
              across SkillForge.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1180px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
          {instructors.length === 0 ? (
            <div className="rounded-[1.9rem] border border-dashed border-[var(--site-border)] bg-[var(--site-surface)] p-10 text-center shadow-[0_18px_40px_var(--site-shadow)]">
              <div className="text-2xl font-bold text-[var(--site-text)]">Instructor profiles are on the way</div>
              <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
                Published instructors will appear here as soon as they are linked to live courses.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              {instructors.map((instructor) => {
                const featuredCourse = pickStartingCourse(instructor.courses);
                const nextCourse = pickNextInstructorCourse(instructor.courses, featuredCourse);
                const advancedCourse = pickCourseByDifficulty(instructor.courses, 'advanced');

                return (
                  <div
                    key={instructor.id}
                    className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_22px_48px_var(--site-shadow)]"
                  >
                    <CourseInstructorSpotlight
                      instructor={instructor}
                      eyebrow="Instructor profile"
                      title={`Learn with ${instructor.fullName}`}
                      description={
                        instructor.bio ??
                        `${instructor.fullName} guides practical course work, checkpoints, and AI-supported explanations across the library.`
                      }
                      ctaHref={`/instructors/${instructor.slug}`}
                      ctaLabel="Open profile"
                      disableProfileLink
                    />

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
                      <div className="mt-5 flex flex-wrap gap-2">
                        {instructor.focusSkills.slice(0, 6).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-[var(--site-primary-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-primary)]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {featuredCourse ? (
                      <div className="mt-5 rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--site-subtle)]">
                          Best place to start
                        </div>
                        <div className="mt-2 text-lg font-semibold text-[var(--site-text)]">
                          {featuredCourse.title}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-[var(--site-muted)]">
                          {featuredCourse.description ??
                            'A guided course designed around focused lessons, checkpoints, and practical study support.'}
                        </p>
                        <Link
                          href={`/courses/${featuredCourse.slug}`}
                          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)]"
                        >
                          Start with this course
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    ) : null}

                    {nextCourse && nextCourse.id !== featuredCourse?.id ? (
                      <div className="mt-4 rounded-[1.35rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--site-subtle)]">
                          Next best step
                        </div>
                        <Link
                          href={`/courses/${nextCourse.slug}`}
                          className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)]"
                        >
                          {nextCourse.title}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    ) : null}

                    {advancedCourse && advancedCourse.id !== featuredCourse?.id ? (
                      <div className="mt-4 rounded-[1.35rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--site-subtle)]">
                          Best for advanced learners
                        </div>
                        <Link
                          href={`/courses/${advancedCourse.slug}`}
                          className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)]"
                        >
                          {advancedCourse.title}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </PublicShell>
  );
}

async function getPublishedInstructors() {
  try {
    return await apiGet<PublicInstructorProfile[]>('/instructors');
  } catch {
    return [];
  }
}

function pickStartingCourse(courses: PublicInstructorProfile['courses']) {
  return pickStartingInstructorCourse(courses);
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
    <div className="rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--site-surface)] text-[var(--site-primary)] shadow-[0_10px_20px_var(--site-shadow)]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--site-subtle)]">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-[var(--site-text)]">{value}</div>
    </div>
  );
}
