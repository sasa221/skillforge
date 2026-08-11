'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bot,
  Clock3,
  Layers3,
  Rocket,
  Sparkles,
  Star,
  MessageSquare,
  Send,
  Target,
  Users,
} from 'lucide-react';

import { CourseAiPanel } from '@/components/ai/CourseAiPanel';
import { CourseArtwork } from '@/components/site/CourseArtwork';
import { CourseInstructorSpotlight } from '@/components/site/CourseInstructorSpotlight';
import { InstructorLevelPicksPanel } from '@/components/site/InstructorLevelPicksPanel';
import { MediaVideoFrame } from '@/components/site/MediaVideoFrame';
import { PublicShell } from '@/components/site/PublicShell';
import { useToast } from '@/components/toast/toast-provider';
import { coursesApi, enrollmentsApi, instructorsApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/lib/auth/store';
import {
  buildInstructorCoursePicks,
  buildInstructorLevelPicks,
  describeCourseFit,
} from '@/lib/content/instructor-course-picks';
import {
  resolveCourseCoverUrl,
  resolveCourseIntroVideoUrl,
  resolveModuleIntroVideoUrl,
} from '@/lib/content/media';
import { headingFont } from '@/lib/fonts';
import type { CourseDetail } from '@/lib/content/types';
import { cn } from '@/lib/utils';

export function CourseDetailsClient({
  slug,
  initialCourse,
}: {
  slug: string;
  initialCourse?: CourseDetail;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const courseQuery = useQuery({
    queryKey: ['courses', 'bySlug', slug],
    queryFn: () => coursesApi.bySlug(slug),
    initialData: initialCourse,
  });

  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments', 'me'],
    queryFn: enrollmentsApi.me,
    enabled: Boolean(user),
  });

  const instructorProfileQuery = useQuery({
    queryKey: ['instructors', 'bySlug', courseQuery.data?.instructor?.slug],
    queryFn: () => instructorsApi.bySlug(courseQuery.data!.instructor!.slug),
    enabled: Boolean(courseQuery.data?.instructor?.slug),
  });

  const enrolledCourse =
    enrollmentsQuery.data?.find((item) => item.course.slug === slug) ?? null;

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!courseQuery.data) throw new Error('Course not loaded');
      return enrollmentsApi.enroll(courseQuery.data.id);
    },
    onSuccess: (enrollment) => {
      toast({
        title: 'Enrollment created',
        description: 'Opening the dashboard version of this course.',
      });
      router.push(`/dashboard/courses/${enrollment.course.slug}`);
    },
    onError: (error) => {
      toast({
        title: 'Enrollment failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  if (courseQuery.isLoading) {
    return (
      <PublicShell>
        <main className="mx-auto w-full max-w-[1180px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="h-[520px] rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
        </main>
      </PublicShell>
    );
  }

  if (courseQuery.isError) {
    return (
      <PublicShell>
        <main className="mx-auto w-full max-w-[1180px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-[1.8rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
            {courseQuery.error instanceof Error ? courseQuery.error.message : 'Could not load course'}
          </div>
        </main>
      </PublicShell>
    );
  }

  if (!courseQuery.data) {
    return (
      <PublicShell>
        <main className="mx-auto w-full max-w-[1180px] px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 text-sm text-[var(--site-muted)]">
            Course not found.
          </div>
        </main>
      </PublicShell>
    );
  }

  const course = courseQuery.data;
  const totalMinutes = resolveCourseMinutes(course);
  const totalLessons = countLessons(course);
  const learningChips = buildLearnChips(course);
  const firstModule = course.modules[0] ?? null;
  const firstLesson = firstModule?.lessons[0] ?? null;
  const instructorReasons = buildInstructorReasons(course);
  const instructorCoursePicks = instructorProfileQuery.data
    ? buildInstructorCoursePicks(course, instructorProfileQuery.data.courses)
    : [];
  const instructorLevelPicks = instructorProfileQuery.data
    ? buildInstructorLevelPicks(
        instructorProfileQuery.data.courses,
        instructorProfileQuery.data.courses.find((entry) => entry.id === course.id) ?? course,
      )
    : [];
  const courseFacts = [
    `${course.modules.length} module${course.modules.length === 1 ? '' : 's'} in this course`,
    `${totalLessons} lesson${totalLessons === 1 ? '' : 's'} across the full path`,
    course.requiresSequentialModules
      ? 'Modules unlock in order so learners build skill step by step'
      : 'Modules can be explored more flexibly based on your pace',
  ];

  return (
    <PublicShell>
      <main className="bg-[radial-gradient(circle_at_top,var(--site-primary-soft),transparent_26%),linear-gradient(180deg,var(--site-bg-soft)_0%,var(--site-bg)_54%,var(--site-bg-soft)_100%)]">
        <section className="mx-auto w-full max-w-[1180px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-alt)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to courses
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:items-center">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary-soft)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--site-primary)]">
                <Sparkles className="h-3.5 w-3.5" />
                Course overview
              </div>

              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[var(--site-muted)]">
                  <span className="rounded-full bg-[var(--site-primary-soft)] px-4 py-2 text-[var(--site-primary)]">
                    {capitalize(course.difficulty)}
                  </span>
                  <span className="rounded-full bg-[var(--site-surface)] px-4 py-2 shadow-[0_12px_24px_var(--site-shadow)]">
                    {formatDuration(totalMinutes)} - {totalLessons} lessons
                  </span>
                </div>
                <h1 className={cn('max-w-[720px] text-5xl font-extrabold leading-[0.96] tracking-[-0.05em] text-[var(--site-text)] sm:text-6xl', headingFont.className)}>
                  {course.title}
                </h1>
                <p className="max-w-[700px] text-lg leading-8 text-[var(--site-muted)]">
                  {course.description ??
                    'A practical course track designed to help learners move from fundamentals to confident execution.'}
                </p>
                <CourseInstructorSpotlight
                  instructor={course.instructor}
                  eyebrow="Course guide"
                  title="Meet your instructor"
                  description={
                    course.instructor?.bio ??
                    'This instructor leads the course examples, pacing, and explanations across the roadmap.'
                  }
                  ctaHref={course.instructor ? `/instructors/${course.instructor.slug}` : undefined}
                  ctaLabel={course.instructor ? 'View instructor profile' : undefined}
                />
              </div>

              <div id="course-actions" className="flex flex-wrap gap-3">
                {enrolledCourse ? (
                  <Link
                    href={`/dashboard/courses/${course.slug}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_38px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)]"
                  >
                    Open in dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : user ? (
                  <button
                    type="button"
                    onClick={() => enrollMutation.mutate()}
                    disabled={enrollMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_38px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)] disabled:opacity-70"
                  >
                    {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <Link
                    href={`/login?next=${encodeURIComponent(`/courses/${slug}`)}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_38px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)]"
                  >
                    Log in to enroll
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}

                <a
                  href="#curriculum"
                  className="inline-flex items-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-6 py-3.5 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-alt)]"
                >
                  View syllabus
                </a>
              </div>

              {enrollMutation.isError ? (
                <div className="rounded-[1.4rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
                  {enrollMutation.error instanceof Error ? enrollMutation.error.message : 'Enrollment failed'}
                </div>
              ) : null}
            </div>

            <div className="space-y-5">
              {resolveCourseIntroVideoUrl(course) ? (
                <MediaVideoFrame
                  url={resolveCourseIntroVideoUrl(course)!}
                  title={`${course.title} intro walkthrough`}
                  caption="Watch the course introduction before you begin the roadmap."
                />
              ) : null}

              <div className="overflow-hidden rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-3 shadow-[0_28px_56px_var(--site-shadow)]">
                <CourseArtwork
                  index={Math.max(0, course.order ?? 0)}
                  label={course.difficulty}
                  imageUrl={resolveCourseCoverUrl(course)}
                  imageAlt={course.title}
                  className="h-[330px]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard icon={Award} title="Structured milestones" description="Move through lessons, checkpoints, and modules with a clear path to completion." />
                <InfoCard icon={Bot} title="Forge AI tutor" description="Ask course questions, request examples, and get help while you study." />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-[1180px] gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1.08fr)_320px] lg:px-8 lg:pb-20">
          <div id="curriculum" className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
                <Layers3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className={cn('text-3xl font-extrabold text-[var(--site-text)]', headingFont.className)}>Course roadmap</h2>
                <p className="mt-1 text-sm text-[var(--site-muted)]">
                  Follow the modules in order and track exactly what each section is meant to teach.
                </p>
              </div>
            </div>

            <CourseReviewsSection courseId={course.id} />
            
            <div className="space-y-5">
              {course.modules.map((module, moduleIndex) => {
                const moduleMinutes = module.lessons.reduce(
                  (sum, lesson) => sum + (lesson.estimatedMinutes ?? 0),
                  0,
                );

                return (
                  <div key={module.id} className="rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_40px_var(--site-shadow)]">
                    <div className="flex flex-col gap-4 border-b border-[var(--site-border)] pb-5 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--site-warm-soft)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--site-warm)]">
                          Module {String(moduleIndex + 1).padStart(2, '0')}
                        </div>
                        <h3 className="text-2xl font-bold text-[var(--site-text)]">{module.title}</h3>
                        <p className="max-w-[720px] text-sm leading-7 text-[var(--site-muted)]">
                          {module.description ??
                            module.lessons[0]?.learningObjective ??
                            `${module.lessons.length} focused lesson${module.lessons.length === 1 ? '' : 's'} built to move this skill forward.`}
                        </p>
                      </div>
                      <div className="rounded-full bg-[var(--site-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--site-muted)]">
                        {formatDuration(moduleMinutes)}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3">
                      {resolveModuleIntroVideoUrl(module) ? (
                        <MediaVideoFrame
                          url={resolveModuleIntroVideoUrl(module)!}
                          title={`${module.title} video overview`}
                          caption="Start this module with a short walkthrough before you open the lessons."
                        />
                      ) : null}

                      {module.lessons.map((lesson, lessonIndex) => (
                        <div key={lesson.id} className="rounded-[1.35rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <div className="text-lg font-bold text-[var(--site-text)]">
                                {lessonIndex + 1}. {lesson.title}
                              </div>
                              <div className="mt-1 text-sm text-[var(--site-muted)]">
                                {lesson.learningObjective ?? 'A focused lesson designed to build this concept step by step.'}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-[var(--site-muted)]">
                              {formatDuration(lesson.estimatedMinutes ?? 0)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="space-y-5">
            <SurfaceCard
              icon={Users}
              title={
                course.instructor ? `Why learn with ${course.instructor.fullName.split(' ')[0]}` : 'Why this course works'
              }
            >
              <div className="space-y-3">
                {instructorReasons.map((reason) => (
                  <div
                    key={reason}
                    className="rounded-[1.3rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3 text-sm leading-7 text-[var(--site-muted)]"
                  >
                    {reason}
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard icon={Target} title="Is this the right fit?">
              <div className="space-y-3">
                <div className="rounded-[1.3rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3 text-sm leading-7 text-[var(--site-muted)]">
                  {describeCourseFit(course.difficulty)}
                </div>
                {instructorCoursePicks.map((pick) => (
                  <div
                    key={`${pick.label}-${pick.course.id}`}
                    className="rounded-[1.3rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3"
                  >
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
                      {pick.label}
                    </div>
                    <div className="mt-2 text-base font-semibold text-[var(--site-text)]">
                      {pick.course.title}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[var(--site-muted)]">{pick.reason}</p>
                    <Link
                      href={`/courses/${pick.course.slug}`}
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)]"
                    >
                      Open course
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            {instructorLevelPicks.length > 0 ? (
              <InstructorLevelPicksPanel
                compact
                title={
                  course.instructor
                    ? `Choose your level with ${course.instructor.fullName.split(' ')[0]}`
                    : 'Choose the right entry point'
                }
                description="If you want to stay with the same instructor, these picks show the clearest starting point, next step, and deeper challenge."
                picks={instructorLevelPicks}
              />
            ) : null}

            <SurfaceCard icon={Rocket} title="Best place to start">
              {firstModule ? (
                <div className="space-y-4">
                  <div className="rounded-[1.3rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3">
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
                      Module 01
                    </div>
                    <div className="mt-2 text-lg font-semibold text-[var(--site-text)]">{firstModule.title}</div>
                    <p className="mt-2 text-sm leading-7 text-[var(--site-muted)]">
                      {firstModule.description ??
                        firstLesson?.learningObjective ??
                        `Start with ${firstModule.title} to build the foundation for the rest of this course.`}
                    </p>
                  </div>
                  {firstLesson ? (
                    <div className="rounded-[1.3rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3">
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
                        First lesson
                      </div>
                      <div className="mt-2 text-base font-semibold text-[var(--site-text)]">{firstLesson.title}</div>
                      <div className="mt-2 text-sm text-[var(--site-muted)]">
                        {formatDuration(firstLesson.estimatedMinutes ?? 0)}
                      </div>
                    </div>
                  ) : null}

                  <a
                    href="#curriculum"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)]"
                  >
                    Jump to the roadmap
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              ) : (
                <p className="text-sm leading-7 text-[var(--site-muted)]">
                  The course roadmap will appear here as soon as modules are published.
                </p>
              )}
            </SurfaceCard>

            <SurfaceCard icon={Target} title="What you will learn">
              <div className="flex flex-wrap gap-2">
                {learningChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-[var(--site-primary-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-primary)]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard icon={Rocket} title="Course facts">
              <div className="space-y-3">
                {courseFacts.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.3rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3 text-sm leading-7 text-[var(--site-muted)]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard icon={Users} title="Learning format">
              <p className="text-sm leading-7 text-[var(--site-muted)]">
                Study at your own pace, move lesson by lesson, and use the AI tutor whenever you need a
                simpler explanation or another example.
              </p>
              <Link
                href="/community"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)]"
              >
                Meet the community
                <ArrowRight className="h-4 w-4" />
              </Link>
            </SurfaceCard>

            <CourseAiPanel
              courseId={course.id}
              courseTitle={course.title}
              unlocked={Boolean(enrolledCourse)}
              ctaHref={
                user ? '#course-actions' : `/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`
              }
              ctaLabel={user ? 'Enroll to unlock AI' : 'Log in to unlock AI'}
            />
          </aside>
        </section>
      </main>
    </PublicShell>
  );
}

function SurfaceCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Target;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_40px_var(--site-shadow)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-xl font-bold text-[var(--site-text)]">{title}</div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Award;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 shadow-[0_18px_32px_var(--site-shadow)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-lg font-bold text-[var(--site-text)]">{title}</div>
      <p className="mt-2 text-sm leading-7 text-[var(--site-muted)]">{description}</p>
    </div>
  );
}

function resolveCourseMinutes(course: CourseDetail): number {
  if (course.estimatedMinutes && course.estimatedMinutes > 0) return course.estimatedMinutes;

  return course.modules.reduce(
    (sum, module) =>
      sum +
      module.lessons.reduce(
        (lessonSum, lesson) => lessonSum + (lesson.estimatedMinutes ?? 0),
        0,
      ),
    0,
  );
}

function countLessons(course: CourseDetail): number {
  return course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
}

function buildLearnChips(course: CourseDetail): string[] {
  const values = [
    ...course.skills.map((skill) => skill.skill.title),
    ...course.tags,
    ...course.modules.slice(0, 3).map((module) => module.title),
  ];

  return Array.from(new Set(values.filter(Boolean))).slice(0, 8);
}

function buildInstructorReasons(course: CourseDetail): string[] {
  const reasons = [
    course.instructor?.title
      ? `${course.instructor.fullName} teaches this course as ${course.instructor.title}.`
      : course.instructor
        ? `${course.instructor.fullName} guides the pacing, examples, and checkpoints throughout this course.`
        : null,
    course.requiresSequentialModules
      ? 'The roadmap unlocks in order, so each module builds on the one before it.'
      : 'You can move through the modules more flexibly while still following a guided structure.',
    course.skills[0]
      ? `You will practice core topics like ${course.skills
          .slice(0, 3)
          .map((entry) => entry.skill.title)
          .join(', ')}.`
      : null,
  ];

  return reasons.filter(Boolean) as string[];
}

function formatDuration(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return 'Self paced';
  if (totalMinutes < 60) return `${totalMinutes} mins`;

  const hours = totalMinutes / 60;
  if (Number.isInteger(hours)) return `${hours} hours`;
  return `${hours.toFixed(1)} hours`;
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function CourseReviewsSection({ courseId }: { courseId: string }) {
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const { data, isLoading } = useQuery({
    queryKey: ['courses', 'reviews', courseId],
    queryFn: () => coursesApi.reviews(courseId),
  });

  const submitMutation = useMutation({
    mutationFn: (body: { rating: number; comment: string }) => coursesApi.addReview(courseId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'reviews', courseId] });
      setComment('');
      toast({ title: 'Review submitted', description: 'Thank you for sharing your course feedback!' });
    },
  });

  const reviews = data?.reviews ?? [];
  const avgRating = data?.avgRating ?? 5.0;
  const totalCount = data?.totalCount ?? 0;

  return (
    <div className="rounded-[2.2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-8 shadow-[0_22px_50px_var(--site-shadow)] space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--site-border)] pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--site-text)]">Student Reviews</h2>
            <p className="text-xs text-[var(--site-muted)]">Real feedback from learners in this course</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-[var(--site-bg-soft)] border border-[var(--site-border)] px-5 py-3">
          <div className="text-3xl font-extrabold text-[var(--site-text)]">{avgRating}</div>
          <div>
            <div className="flex items-center gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'fill-amber-500' : 'text-zinc-600'}`} />
              ))}
            </div>
            <div className="text-[11px] text-[var(--site-muted)] font-medium">{totalCount} total reviews</div>
          </div>
        </div>
      </div>

      {/* Review submission form */}
      {user ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!comment.trim()) return;
            submitMutation.mutate({ rating, comment });
          }}
          className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--site-text)]">Leave a Review</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-125"
                >
                  <Star className={`h-5 w-5 ${star <= rating ? 'fill-amber-500 text-amber-500' : 'text-zinc-500'}`} />
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this course, instructor, or exercises..."
            rows={3}
            className="w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-3 text-sm text-[var(--site-text)] focus:border-[var(--site-primary)] focus:outline-none"
          />

          <button
            type="submit"
            disabled={submitMutation.isPending || !comment.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--site-primary)] px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {submitMutation.isPending ? 'Submitting...' : 'Post Review'}
          </button>
        </form>
      ) : null}

      {/* Review list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--site-bg)]" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev: any) => (
            <div key={rev.id} className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--site-primary)]/10 text-xs font-bold text-[var(--site-primary)]">
                    {rev.userName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--site-text)]">{rev.userName}</div>
                    <div className="text-[10px] text-[var(--site-muted)]">{new Date(rev.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-3.5 w-3.5 ${s <= rev.rating ? 'fill-amber-500' : 'text-zinc-700'}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs leading-relaxed text-[var(--site-muted)]">{rev.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
