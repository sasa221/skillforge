'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bot,
  CheckCircle2,
  Clock3,
  Layers3,
  MessageSquareMore,
  Rocket,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';

import { CourseAiPanel } from '@/components/ai/CourseAiPanel';
import { CourseArtwork } from '@/components/site/CourseArtwork';
import { CourseInstructorSpotlight } from '@/components/site/CourseInstructorSpotlight';
import { InstructorLevelPicksPanel } from '@/components/site/InstructorLevelPicksPanel';
import { enrollmentsApi, instructorsApi, progressApi } from '@/lib/api/endpoints';
import {
  buildInstructorCoursePicks,
  buildInstructorLevelPicks,
  describeCourseFit,
} from '@/lib/content/instructor-course-picks';
import { resolveCourseCoverUrl } from '@/lib/content/media';
import { headingFont } from '@/lib/fonts';
import type { CourseDetail, CourseProgress, LessonSummary, ModuleSummary } from '@/lib/content/types';
import { cn } from '@/lib/utils';

type ModuleView = {
  id: string;
  title: string;
  description: string | null;
  percent: number;
  locked: boolean;
  completed: boolean;
  checkpointRequired: boolean;
  checkpointPassed: boolean;
  checkpointLessonSlug: string | null;
  checkpointLessonTitle: string | null;
  status: 'completed' | 'in_progress' | 'up_next' | 'locked';
  lessonsCount: number;
  completedLessonsCount: number;
  estimatedMinutes: number;
  nextLessonSlug: string | null;
  nextLessonTitle: string | null;
  summary: string;
};

export function DashboardCourseClient({ courseSlug }: { courseSlug: string }) {
  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments', 'me'],
    queryFn: enrollmentsApi.me,
  });

  const enrollment =
    enrollmentsQuery.data?.find((item) => item.course.slug === courseSlug) ?? null;

  const progressQuery = useQuery({
    queryKey: ['progress', 'course', enrollment?.course.id],
    queryFn: () => progressApi.course(enrollment!.course.id),
    enabled: Boolean(enrollment?.course.id),
  });

  const instructorProfileQuery = useQuery({
    queryKey: ['instructors', 'bySlug', enrollment?.course.instructor?.slug],
    queryFn: () => instructorsApi.bySlug(enrollment!.course.instructor!.slug),
    enabled: Boolean(enrollment?.course.instructor?.slug),
  });

  if (enrollmentsQuery.isLoading) {
    return (
      <main className="space-y-6">
        <div className="h-8 w-48 rounded-full bg-[var(--site-surface-alt)]" />
        <div className="h-[380px] rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
      </main>
    );
  }

  if (enrollmentsQuery.isError) {
    return (
      <main className="rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
        {enrollmentsQuery.error instanceof Error ? enrollmentsQuery.error.message : 'Could not load your course'}
      </main>
    );
  }

  if (!enrollment) {
    return (
      <main className="rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-8 shadow-[0_18px_40px_var(--site-shadow)]">
        <div className="text-2xl font-bold text-[var(--site-text)]">This course is not in your library</div>
        <p className="mt-3 max-w-[680px] text-sm leading-7 text-[var(--site-subtle)]">
          You are not enrolled in this course yet. Open the course details, enroll, and your learning progress will
          appear here right away.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/courses"
            className="rounded-full bg-[var(--site-primary)] px-5 py-3 text-sm font-semibold text-white"
          >
            Back to library
          </Link>
          <Link
            href={`/courses/${courseSlug}`}
            className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-5 py-3 text-sm font-semibold text-[var(--site-text)]"
          >
            View course details
          </Link>
        </div>
      </main>
    );
  }

  const course = enrollment.course;
  const progress = progressQuery.data ?? null;
  const moduleViews = buildModuleViews(course, progress);
  const firstContinueLesson =
    resolveContinueLesson(moduleViews) ?? course.modules[0]?.lessons[0]?.slug ?? null;
  const totalLessons = progress?.totalLessons ?? countLessons(course.modules);
  const completedLessons = progress?.completedLessons ?? 0;
  const totalMinutes = resolveCourseMinutes(course);
  const xpReward = estimateXp(totalMinutes, totalLessons);
  const activeModule = moduleViews.find((module) => module.status === 'in_progress') ?? moduleViews[0] ?? null;
  const nextStepLessonTitle = resolveNextLessonTitle(moduleViews);
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

  return (
    <main className="space-y-8 pb-6">
      <Link
        href="/dashboard/courses"
        className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-alt)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to library
      </Link>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_320px]">
        <div className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_22px_48px_var(--site-shadow)] lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary-soft)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--site-primary)]">
                <Sparkles className="h-3.5 w-3.5" />
                Course overview
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[var(--site-muted)]">
                  <span className="rounded-full bg-[var(--site-primary-soft)] px-4 py-2 text-[var(--site-primary)]">
                    {capitalize(course.difficulty)}
                  </span>
                  <span className="rounded-full bg-[var(--site-surface-alt)] px-4 py-2 text-[var(--site-muted)]">
                    {formatDuration(totalMinutes)} {' '}<span aria-hidden="true">&middot;</span>{' '}{totalLessons} lessons
                  </span>
                </div>
                <h1
                  className={cn(
                    'max-w-[720px] text-5xl font-extrabold leading-[0.96] tracking-[-0.05em] text-[var(--site-text)]',
                    headingFont.className,
                  )}
                >
                  {course.title}
                </h1>
                <p className="max-w-[720px] text-lg leading-8 text-[var(--site-muted)]">
                  {course.description ??
                    'Your course overview keeps progress, roadmap milestones, and study support in one focused place.'}
                </p>
                <CourseInstructorSpotlight
                  instructor={course.instructor}
                  compact
                  eyebrow="Course guide"
                  title="Meet your course instructor"
                  description={
                    course.description
                      ? `Your instructor will guide the examples, checkpoints, and pacing across ${course.title}.`
                      : undefined
                  }
                  ctaHref={course.instructor ? `/instructors/${course.instructor.slug}` : undefined}
                  ctaLabel={course.instructor ? 'View instructor profile' : undefined}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                {firstContinueLesson ? (
                  <Link
                    href={`/dashboard/lessons/${firstContinueLesson}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_38px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)]"
                  >
                    Continue lesson
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
                <a
                  href="#roadmap"
                  className="inline-flex items-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-6 py-3.5 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-alt)]"
                >
                  Open roadmap
                </a>
              </div>
            </div>

            <div className="space-y-4 rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5">
              <div className="overflow-hidden rounded-[1.5rem]">
                <CourseArtwork
                  index={Math.max(0, course.order ?? 0)}
                  label={course.difficulty}
                  imageUrl={resolveCourseCoverUrl(course)}
                  imageAlt={course.title}
                  className="h-[210px]"
                />
              </div>
              <div className="grid gap-3">
                <StatPill label="Progress" value={`${progress?.percent ?? 0}%`} />
                <StatPill label="XP reward" value={`+${xpReward.toLocaleString()} XP`} />
                <StatPill label="Completed" value={`${completedLessons}/${totalLessons}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_22px_48px_var(--site-shadow)]">
          <MiniFeature icon={Award} title="Certificate progress" description="Learners can keep an eye on completion requirements and rewards from the same course space." />
          <MiniFeature icon={Bot} title="AI study support" description="The lesson tutor stays available from this course as you move across modules and checkpoints." />
          <MiniFeature icon={MessageSquareMore} title="Community support" description="Jump into the community hub whenever you want mentor help or peer discussion around this course." />
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.12fr)_320px]">
        <div id="roadmap" className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className={cn('text-3xl font-extrabold text-[var(--site-text)]', headingFont.className)}>Learning roadmap</h2>
              <p className="mt-1 text-sm text-[var(--site-subtle)]">
                Every module reflects your current progress and what unlocks next.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {moduleViews.map((module, index) => (
              <div key={module.id} className="grid grid-cols-[42px_minmax(0,1fr)] gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border',
                      module.status === 'completed' && 'border-[var(--site-border)] bg-[var(--site-success-soft)] text-[var(--site-success)]',
                      module.status === 'in_progress' && 'border-[var(--site-border)] bg-[var(--site-primary-soft)] text-[var(--site-primary)]',
                      module.status === 'up_next' && 'border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-subtle)]',
                      module.status === 'locked' && 'border-[var(--site-border)] bg-[var(--site-surface-alt)] text-[var(--site-subtle)]',
                    )}
                  >
                    {module.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : module.status === 'in_progress' ? (
                      <Rocket className="h-5 w-5" />
                    ) : (
                      <Trophy className="h-5 w-5" />
                    )}
                  </div>
                  {index < moduleViews.length - 1 ? <div className="mt-3 h-full w-px bg-[var(--site-border)]" /> : null}
                </div>

                <div className="rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_40px_var(--site-shadow)]">
                  <div className="flex flex-col gap-4 border-b border-[var(--site-border)] pb-5 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-2xl font-bold text-[var(--site-text)]">{module.title}</h3>
                        <span
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]',
                            module.status === 'completed' && 'bg-[var(--site-success-soft)] text-[var(--site-success)]',
                            module.status === 'in_progress' && 'bg-[var(--site-primary-soft)] text-[var(--site-primary)]',
                            module.status === 'up_next' && 'bg-[var(--site-surface-alt)] text-[var(--site-subtle)]',
                            module.status === 'locked' && 'bg-[var(--site-danger-soft)] text-[var(--site-danger)]',
                          )}
                        >
                          {module.status === 'completed'
                            ? 'Completed'
                            : module.status === 'in_progress'
                              ? 'In progress'
                              : module.status === 'locked'
                                ? 'Locked'
                                : 'Up next'}
                        </span>
                      </div>
                      <p className="max-w-[760px] text-sm leading-7 text-[var(--site-subtle)]">{module.summary}</p>
                    </div>

                    {module.nextLessonSlug && !module.locked ? (
                      <Link
                        href={`/dashboard/lessons/${module.nextLessonSlug}`}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-alt)]"
                      >
                        {module.status === 'completed' ? 'Review' : 'Open'}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : module.locked ? (
                      <div className="rounded-full bg-[var(--site-danger-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--site-danger)]">
                        Complete the previous module to unlock this step
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-[var(--site-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-4 w-4 text-[var(--site-subtle)]" />
                      {formatDuration(module.estimatedMinutes)}
                    </span>
                    <span>{module.completedLessonsCount}/{module.lessonsCount} lessons</span>
                  </div>

                  <div className="mt-5 h-2 rounded-full bg-[var(--site-border)]">
                    <div className="h-2 rounded-full bg-[var(--site-primary)]" style={{ width: `${module.percent}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <SidebarCard icon={Sparkles} title="Course summary">
            <SidebarStat label="Overall progress" value={`${progress?.percent ?? 0}%`} />
            <SidebarStat label="Next lesson" value={resolveNextLessonTitle(moduleViews)} />
            <SidebarStat label="Estimated effort" value={formatDuration(totalMinutes)} />
          </SidebarCard>

          <SidebarCard
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
            </SidebarCard>

          <SidebarCard icon={Rocket} title="Right course for this stage?">
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
                    href={`/dashboard/courses/${pick.course.slug}`}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)]"
                  >
                    Open in dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </SidebarCard>

          {instructorLevelPicks.length > 0 ? (
            <InstructorLevelPicksPanel
              compact
              title={
                course.instructor
                  ? `Choose your level with ${course.instructor.fullName.split(' ')[0]}`
                  : 'Choose the right entry point'
              }
              description="Stay with the same instructor and pick the clearest starting point, next step, or deeper challenge."
              picks={instructorLevelPicks}
              courseHrefBuilder={(slug) => `/dashboard/courses/${slug}`}
              ctaLabel="Open in dashboard"
            />
          ) : null}

          <SidebarCard icon={Rocket} title="Best next step">
            {activeModule ? (
              <div className="space-y-3">
                <SidebarStat label="Current module" value={activeModule.title} />
                <SidebarStat label="Next lesson" value={nextStepLessonTitle} />
                <SidebarStat
                  label="Module progress"
                  value={`${activeModule.completedLessonsCount}/${activeModule.lessonsCount} lessons complete`}
                />
                {activeModule.nextLessonSlug ? (
                  <Link
                    href={`/dashboard/lessons/${activeModule.nextLessonSlug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)]"
                  >
                    Open next lesson
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="text-sm leading-7 text-[var(--site-muted)]">
                Your next lesson will appear here as soon as the roadmap is ready.
              </div>
            )}
          </SidebarCard>

          <CourseAiPanel courseId={course.id} courseTitle={course.title} unlocked />
        </aside>
      </section>
    </main>
  );
}

function MiniFeature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Award;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--site-surface)] text-[var(--site-primary)] shadow-[0_10px_20px_var(--site-shadow)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-lg font-bold text-[var(--site-text)]">{title}</div>
      <div className="mt-2 text-sm leading-7 text-[var(--site-subtle)]">{description}</div>
    </div>
  );
}

function SidebarCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Sparkles;
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
      <div className="mt-5 space-y-3">{children}</div>
    </div>
  );
}

function SidebarStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3">
      <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--site-subtle)]">{label}</div>
      <div className="mt-1 text-sm font-semibold text-[var(--site-text)]">{value}</div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3">
      <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--site-subtle)]">{label}</div>
      <div className="mt-1 text-sm font-semibold text-[var(--site-text)]">{value}</div>
    </div>
  );
}

function buildModuleViews(course: CourseDetail, progress: CourseProgress | null): ModuleView[] {
  const progressMap = new Map(progress?.modules.map((module) => [module.id, module]) ?? []);
  const activeModuleIndex = course.modules.findIndex((module) => {
    const progressModule = progressMap.get(module.id);
    return !progressModule?.locked && !progressModule?.completed;
  });

  return course.modules.map((module, index) => {
    const progressModule = progressMap.get(module.id);
    const progressLessons = progressModule?.lessons ?? [];
    const completedLessonsCount = progressLessons.filter((lesson) => lesson.completed).length ?? 0;
    const lessonsCount = module.lessons.length;
    const estimatedMinutes = module.lessons.reduce(
      (sum, lesson) => sum + (lesson.estimatedMinutes ?? 0),
      0,
    );

    let status: ModuleView['status'] = 'up_next';
    if (progressModule?.locked) {
      status = 'locked';
    } else if (progressModule?.completed) {
      status = 'completed';
    } else if (index === (activeModuleIndex === -1 ? 0 : activeModuleIndex)) {
      status = 'in_progress';
    }

    const nextLesson =
      module.lessons.find((lesson) => {
        const progressLesson = progressLessons.find((item) => item.id === lesson.id);
        return !progressLesson?.completed;
      }) ?? module.lessons[0] ?? null;

    return {
      id: module.id,
      title: module.title,
      description: module.description,
      percent: progressModule?.percent ?? 0,
      locked: progressModule?.locked ?? false,
      completed: progressModule?.completed ?? false,
      checkpointRequired: progressModule?.checkpointRequired ?? false,
      checkpointPassed: progressModule?.checkpointPassed ?? false,
      checkpointLessonSlug: progressModule?.checkpointLessonSlug ?? null,
      checkpointLessonTitle: progressModule?.checkpointLessonTitle ?? null,
      status,
      lessonsCount,
      completedLessonsCount,
      estimatedMinutes,
      nextLessonSlug:
        progressModule?.checkpointRequired &&
        !progressModule?.checkpointPassed &&
        completedLessonsCount === lessonsCount
          ? progressModule?.checkpointLessonSlug ?? nextLesson?.slug ?? null
          : nextLesson?.slug ?? null,
      nextLessonTitle:
        progressModule?.checkpointRequired &&
        !progressModule?.checkpointPassed &&
        completedLessonsCount === lessonsCount
          ? progressModule?.checkpointLessonTitle ?? nextLesson?.title ?? null
          : nextLesson?.title ?? null,
      summary: progressModule?.locked
        ? `Finish the previous module${progressModule?.checkpointRequired ? ' and pass its checkpoint' : ''} to unlock this module.`
        : progressModule?.checkpointRequired &&
          !progressModule?.checkpointPassed &&
          completedLessonsCount === lessonsCount
          ? `All lessons are done. Pass "${progressModule?.checkpointLessonTitle ?? 'the module checkpoint'}" to unlock the next module.`
        : module.description ??
          nextLesson?.learningObjective ??
          `Build confidence through ${lessonsCount} focused lessons in ${module.title}.`,
    };
  });
}

function resolveContinueLesson(modules: ModuleView[]): string | null {
  const inProgressModule = modules.find((module) => module.status === 'in_progress');
  if (inProgressModule?.nextLessonSlug) return inProgressModule.nextLessonSlug;

  const nextModule = modules.find((module) => !module.locked && module.nextLessonSlug);
  return nextModule?.nextLessonSlug ?? null;
}

function resolveNextLessonTitle(modules: ModuleView[]): string {
  return (
    modules.find((module) => module.status === 'in_progress')?.nextLessonTitle ??
    modules.find((module) => module.status === 'up_next' && !module.locked)?.nextLessonTitle ??
    modules[modules.length - 1]?.nextLessonTitle ??
    'Course complete'
  );
}

function countLessons(modules: ModuleSummary[]): number {
  return modules.reduce((sum, module) => sum + module.lessons.length, 0);
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

function estimateXp(totalMinutes: number, totalLessons: number): number {
  if (totalMinutes > 0) return Math.max(1200, totalMinutes * 80);
  return Math.max(1200, totalLessons * 500);
}

function formatDuration(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return 'Self paced';
  if (totalMinutes < 60) return `${totalMinutes} mins`;

  const hours = totalMinutes / 60;
  if (Number.isInteger(hours)) return `${hours} hours`;
  return `${hours.toFixed(1)} hours`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildInstructorReasons(course: CourseDetail): string[] {
  const reasons = [
    course.instructor?.title
      ? `${course.instructor.fullName} leads this course as ${course.instructor.title}.`
      : course.instructor
        ? `${course.instructor.fullName} guides the course examples, pacing, and checkpoints.`
        : null,
    course.requiresSequentialModules
      ? 'Modules unlock in order, so your study path stays focused and cumulative.'
      : 'You can move more flexibly through the roadmap while keeping the core path clear.',
    course.skills[0]
      ? `This course keeps practice close to ${course.skills
          .slice(0, 3)
          .map((entry) => entry.skill.title)
          .join(', ')}.`
      : null,
  ];

  return reasons.filter(Boolean) as string[];
}


