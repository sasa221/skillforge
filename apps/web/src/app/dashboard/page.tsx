'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bot,
  BrainCircuit,
  ChartColumnIncreasing,
  Flame,
  LogOut,
  Rocket,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';

import { AchievementList } from '@/components/dashboard/AchievementList';
import { ContinueLearningCard } from '@/components/dashboard/ContinueLearningCard';
import { InstructorLevelPicksPanel } from '@/components/site/InstructorLevelPicksPanel';
import { CourseInstructorSpotlight } from '@/components/site/CourseInstructorSpotlight';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api/client';
import { aiApi, instructorsApi, progressApi } from '@/lib/api/endpoints';
import { buildInstructorLevelPicks } from '@/lib/content/instructor-course-picks';
import { resolveMediaUrl } from '@/lib/content/media';
import { useAuthStore } from '@/lib/auth/store';
import { Streak3DFlame } from '@/components/3d/Streak3DFlame';
import { Trophy3D } from '@/components/3d/Trophy3D';
import { headingFont } from '@/lib/fonts';
import { cn } from '@/lib/utils';

const spotlightCards = [
  {
    title: 'AI Lesson Coach',
    description: 'Ask for hints, summaries, and step-by-step explanations without leaving the lesson.',
    icon: Bot,
  },
  {
    title: 'Micro lessons',
    description: 'Short units keep momentum high and make daily study easier to sustain.',
    icon: BrainCircuit,
  },
  {
    title: 'Visible progress',
    description: 'Track streaks, XP, course completion, and quiz performance in one place.',
    icon: ChartColumnIncreasing,
  },
  {
    title: 'Skill proof',
    description: 'Recent badges and completed quizzes make your progress feel tangible.',
    icon: BadgeCheck,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    initialData: user ?? undefined,
  });

  const dashQuery = useQuery({
    queryKey: ['progress', 'dashboard'],
    queryFn: progressApi.dashboard,
  });

  const recommendationsQuery = useQuery({
    queryKey: ['ai', 'recommendations'],
    queryFn: aiApi.recommendations,
  });

  const activityQuery = useQuery({
    queryKey: ['progress', 'activity-feed'],
    queryFn: progressApi.activityFeed,
  });

  const me = meQuery.data;
  const dash = dashQuery.data;

  const learnerName = me?.profile?.fullName ?? me?.email?.split('@')[0] ?? 'Learner';
  const roles = me?.roles ?? [];
  const canAccessAdmin = roles.some((role) => role === 'admin' || role === 'content_manager' || role === 'super_admin');
  const streakDays = dash?.streakDays ?? 0;
  const xp = dash?.xp ?? me?.profile?.xp ?? 0;
  const level = dash?.level ?? me?.profile?.level ?? 1;
  const completedLessonsCount = dash?.completedLessonsCount ?? 0;
  const enrollmentsCount = dash?.enrollmentsCount ?? 0;
  const recentAttempts = dash?.recentQuizAttempts ?? [];
  const badges = dash?.recentBadges ?? [];
  const activeCourse = dash?.activeCourse ?? null;
  const interests = (me?.profile?.interests ?? []).filter((value): value is string => Boolean(value));
  const skillPills = interests;
  const interestsText = interests.length > 0 ? interests.join(', ') : 'Not set yet';
  const continueHref = dash?.continueLesson ? `/dashboard/lessons/${dash.continueLesson.slug}` : '/dashboard/courses';
  const courseProgress = activeCourse?.percent ?? 0;
  const activeCourseCoverUrl = activeCourse
    ? resolveMediaUrl(activeCourse.coverImageAsset, activeCourse.coverImageUrl)
    : null;
  const currentModuleLabel = activeCourse?.currentModuleTitle
    ? `${activeCourse.currentModuleOrder ? `Module ${activeCourse.currentModuleOrder}: ` : ''}${activeCourse.currentModuleTitle}`
    : 'Choose a course to start your first guided module.';
  const nextFocusLabel = dash?.continueLesson
    ? dash.continueLesson.checkpointPending
      ? `Pass the checkpoint in ${dash.continueLesson.title}`
      : `Study ${dash.continueLesson.title}`
    : 'Explore published courses to start learning.';
  const instructorProfileQuery = useQuery({
    queryKey: ['public', 'instructors', 'bySlug', activeCourse?.instructor?.slug],
    queryFn: () => instructorsApi.bySlug(activeCourse!.instructor!.slug),
    enabled: Boolean(activeCourse?.instructor?.slug),
  });
  const dashboardRoutePicks = instructorProfileQuery.data
    ? buildInstructorLevelPicks(
        instructorProfileQuery.data.courses,
        instructorProfileQuery.data.courses.find((course) => course.slug === activeCourse?.slug) ?? null,
      )
    : [];

  return (
    <main className="space-y-8 pb-6">
      <section className="rounded-[2rem] border border-[var(--site-border)] bg-[radial-gradient(circle_at_top_right,var(--site-primary-soft),transparent_28%),linear-gradient(180deg,var(--site-surface),var(--site-bg-soft))] p-6 shadow-[0_24px_64px_var(--site-shadow)] backdrop-blur-xl lg:p-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_360px] xl:items-start">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--site-primary-soft)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--site-primary)]">
                <Sparkles className="h-3.5 w-3.5" />
                Learning dashboard
              </div>
            </div>

            {/* 3D Interactive Gamification Widgets Header */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Streak3DFlame streakDays={streakDays || 1} size={68} />
              <Trophy3D level={level || 1} size={68} />
            </div>

            <div className="max-w-3xl space-y-5">
              <h1
                className={cn(
                  'max-w-3xl text-4xl font-extrabold leading-[0.95] tracking-[-0.05em] text-[var(--site-text)] sm:text-5xl lg:text-6xl',
                  headingFont.className,
                )}
              >
                Welcome back, {learnerName}
                <span className="block text-[var(--site-primary)]">Let&apos;s keep your momentum up.</span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--site-muted)]">
                Your home view keeps the useful things in one place: current lesson, weekly pace,
                XP, badges, and a clean path back into your active courses.
              </p>
            </div>

            <div className="rounded-[1.7rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-lg font-semibold text-[var(--site-text)]">Current course progress</div>
                  <div className="mt-1 text-sm text-[var(--site-muted)]">
                    {activeCourse
                      ? `${activeCourse.title}`
                      : 'Choose a course and the dashboard will start tracking your course progress here.'}
                  </div>
                  <CourseInstructorSpotlight
                    instructor={activeCourse?.instructor}
                    compact
                    className="mt-4"
                    eyebrow="Current course guide"
                    title="Learn with your instructor"
                    description={
                      activeCourse
                        ? activeCourse.checkpointPending
                          ? `You are currently in ${currentModuleLabel}. Finish the checkpoint gate to unlock the next module with the same instructor guidance.`
                          : `You are currently in ${currentModuleLabel}. Keep moving through ${activeCourse.title} with course-specific support from your instructor.`
                        : undefined
                    }
                    ctaHref={activeCourse?.instructor ? `/instructors/${activeCourse.instructor.slug}` : undefined}
                    ctaLabel={activeCourse?.instructor ? 'View instructor profile' : undefined}
                  />
                </div>
                <div className="flex items-center gap-4 self-start">
                  {activeCourseCoverUrl ? (
                    <div className="hidden h-20 w-28 overflow-hidden rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-bg-soft)] sm:block">
                      <img src={activeCourseCoverUrl} alt={activeCourse?.title ?? 'Course cover'} className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                  <div className="text-2xl font-bold text-[var(--site-primary)]">{courseProgress}%</div>
                </div>
              </div>
              <div className="mt-4 h-3 rounded-full bg-[var(--site-border)]">
                <div
                  className="h-3 rounded-full bg-[linear-gradient(90deg,var(--site-primary),#49d18d)]"
                  style={{ width: `${courseProgress}%` }}
                />
              </div>
              <div className="mt-3 text-sm italic text-[var(--site-subtle)]">
                {activeCourse
                  ? activeCourse.checkpointPending
                    ? `${activeCourse.completedLessons} of ${activeCourse.totalLessons} lessons completed. A checkpoint in ${currentModuleLabel} is the next gate before the following module opens.`
                    : `${activeCourse.completedLessons} of ${activeCourse.totalLessons} lessons completed across ${activeCourse.totalModules} module${activeCourse.totalModules === 1 ? '' : 's'}.`
                  : 'Start your first course and the dashboard will begin tracking your progress here.'}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <MetricPill
                icon={Trophy}
                label="Total XP"
                value={xp.toLocaleString()}
                detail="Across your current activity"
              />
              <MetricPill
                icon={Target}
                label="Current level"
                value={`${level}`}
                detail="Updated as you complete lessons and pass checkpoints"
              />
              <MetricPill
                icon={BadgeCheck}
                label="Recent badges"
                value={`${badges.length}`}
                detail="Latest milestones unlocked"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={continueHref}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_30px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)]"
              >
                {dash?.continueLesson ? 'Continue learning' : 'Browse my courses'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/courses"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-6 py-3.5 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
              >
                My courses
              </Link>
              <Button
                variant="outline"
                className="rounded-full border-[var(--site-border)] bg-[var(--site-surface)] px-6 py-3.5 text-sm font-semibold text-[var(--site-text)] hover:bg-[var(--site-surface-alt)] hover:text-[var(--site-text)]"
                onClick={async () => {
                  try {
                    await authApi.logout();
                  } finally {
                    clearSession();
                    router.push('/login');
                  }
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--site-muted)]">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--site-surface-alt)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--site-subtle)]">
                <BookOpen className="h-3.5 w-3.5" />
                {enrollmentsCount} active course{enrollmentsCount === 1 ? '' : 's'}
              </div>
              <span>
                {activeCourse
                  ? `${completedLessonsCount} lesson${completedLessonsCount === 1 ? '' : 's'} completed so far, with ${activeCourse.completedModules} module${activeCourse.completedModules === 1 ? '' : 's'} fully finished in your current course.`
                  : `${completedLessonsCount} lesson${completedLessonsCount === 1 ? '' : 's'} completed so far across your learning plan.`}
              </span>
            </div>
          </div>

          <div className="space-y-4 rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_24px_64px_var(--site-shadow)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--site-subtle)]">
                  AI study support
                </div>
                <div className="mt-2 text-4xl font-extrabold text-[var(--site-text)]">Ready for today</div>
                <p className="mt-2 text-base leading-7 text-[var(--site-muted)]">
                  {dash?.continueLesson
                    ? dash.continueLesson.checkpointPending
                      ? `Your assistant is ready to help you pass "${dash.continueLesson.title}" and unlock the next module.`
                      : `Your assistant is ready to help you continue "${dash.continueLesson.title}" with hints and checkpoints.`
                    : 'Pick a course and the assistant will start generating short study guidance here.'}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-[var(--site-primary)] text-white shadow-[0_16px_28px_var(--site-shadow)]">
                <Rocket className="h-7 w-7" />
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5">
              <div className="text-sm font-semibold text-[var(--site-primary)]">Coach prompt</div>
              <p className="mt-3 text-base leading-7 text-[var(--site-muted)]">
                {dash?.continueLesson
                  ? dash.continueLesson.checkpointPending
                    ? `Hello ${learnerName}, stay inside ${currentModuleLabel} and I will help you pass "${dash.continueLesson.title}" so the next module opens with confidence.`
                    : `Hello ${learnerName}, resume "${dash.continueLesson.title}" inside ${currentModuleLabel} and I will help you keep the next lesson clear and focused.`
                  : `Hello ${learnerName}, pick a course and I will break it into short wins with quick explanations and review prompts.`}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SurfaceMiniCard
                eyebrow="Current track"
                title={dash?.continueLesson?.courseTitle ?? 'Choose your next course'}
                hint={currentModuleLabel}
              />
              <SurfaceMiniCard
                eyebrow={dash?.continueLesson?.checkpointPending ? 'Checkpoint gate' : 'Next focus'}
                title={nextFocusLabel}
                hint={
                  dash?.continueLesson
                    ? dash.continueLesson.checkpointPending
                      ? 'Pass this checkpoint to unlock the next module in your course path.'
                      : 'Keep your queue lean so daily progress stays consistent.'
                    : 'Pick a course to see your next lesson and progress here.'
                }
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {skillPills.length === 0 ? (
                <span className="rounded-full bg-[var(--site-surface-alt)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--site-subtle)]">
                  Add interests in your profile to personalize this panel
                </span>
              ) : (
                skillPills.map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full bg-[var(--site-primary-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--site-primary)]"
                  >
                    {toTitleCase(pill)}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {meQuery.isError ? (
        <section className="rounded-[1.75rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-5 text-sm text-[var(--site-danger)]">
          <div className="font-semibold">Could not load your session</div>
          <div className="mt-2 text-[var(--site-danger)]">
            {meQuery.error instanceof Error ? meQuery.error.message : 'Unknown error'}
          </div>
        </section>
      ) : null}

      {/* ✨ Recommended for You Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[var(--site-text)] flex items-center gap-2 px-2">
          <Sparkles className="h-5 w-5 text-yellow-500" /> Recommended for You
        </h2>
        {recommendationsQuery.isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-[var(--site-border)] rounded-[1.2rem]" />
          </div>
        ) : recommendationsQuery.data ? (
          <div className="space-y-4">
            {recommendationsQuery.data.studyTip && (
              <div className="rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-primary-soft)] p-5 text-sm text-[var(--site-text)]">
                <span className="font-bold text-[var(--site-primary)]">Daily Tip: </span>
                {recommendationsQuery.data.studyTip}
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-3">
              {recommendationsQuery.data.nextLessons?.map((rec: any, idx: number) => (
                <div key={idx} className="rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 shadow-[0_18px_40px_var(--site-shadow)] flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-semibold text-[var(--site-subtle)] uppercase tracking-wider">{rec.courseTitle}</div>
                    <div className="mt-2 font-bold text-[var(--site-text)] line-clamp-2">{rec.lessonTitle}</div>
                    <div className="mt-2 text-xs text-[var(--site-muted)]">{rec.reason}</div>
                  </div>
                  <Link href={`/dashboard/lessons/${rec.lessonSlug}`} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--site-primary)] transition hover:text-[var(--site-primary-strong)]">
                    Continue <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
              {recommendationsQuery.data.weakAreas?.map((rec: any, idx: number) => (
                <div key={idx + 3} className="rounded-[1.2rem] border border-[var(--site-danger)]/30 bg-[var(--site-danger-soft)] p-5 shadow-[0_18px_40px_var(--site-shadow)] flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-semibold text-[var(--site-danger)] uppercase tracking-wider">{rec.courseTitle}</div>
                    <div className="mt-2 font-bold text-[var(--site-danger)] line-clamp-2">{rec.lessonTitle}</div>
                    <div className="mt-2 text-xs text-[var(--site-danger)]/80">{rec.reason}</div>
                  </div>
                  <Link href={rec.lessonSlug ? `/dashboard/lessons/${rec.lessonSlug}` : '#'} className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[var(--site-danger)] transition hover:opacity-80">
                    Review lesson <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )).slice(0, 3 - (recommendationsQuery.data.nextLessons?.length || 0))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {spotlightCards.map((card) => (
          <div
            key={card.title}
            className="rounded-[1.75rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 shadow-[0_18px_40px_var(--site-shadow)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
              <card.icon className="h-5 w-5" />
            </div>
            <div className="mt-5 text-lg font-semibold text-[var(--site-text)]">{card.title}</div>
            <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">{card.description}</p>
          </div>
        ))}
      </section>

      {dashboardRoutePicks.length > 0 ? (
        <InstructorLevelPicksPanel
          title={
            activeCourse?.instructor
              ? `Best route for you now with ${activeCourse.instructor.fullName.split(' ')[0]}`
              : 'Best route for you now'
          }
          description={
            activeCourse
              ? activeCourse.checkpointPending
                ? `You are currently inside ${currentModuleLabel}, and a checkpoint is the next gate. If you want to stay with the same instructor, here is the clearest route around your current stage.`
                : `You are currently inside ${activeCourse.title}. If you want to stay with the same instructor, here is the clearest starting point, next step, and deeper challenge.`
              : 'Choose the cleanest starting point, next step, or deeper challenge with the same instructor.'
          }
          picks={dashboardRoutePicks}
          courseHrefBuilder={(slug) => `/dashboard/courses/${slug}`}
          ctaLabel="Open in dashboard"
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <ContinueLearningCard continueLesson={dash?.continueLesson ?? null} isLoading={dashQuery.isLoading} />
        <AchievementList badges={dash?.recentBadges} isLoading={dashQuery.isLoading} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_20px_65px_var(--site-shadow)]">
          <div className="flex items-center justify-between gap-3">
            <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--site-subtle)]">
            Checkpoint results
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--site-text)]">Recent checkpoint results</h2>
            </div>
            <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)] sm:flex">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>

          {dashQuery.isLoading ? (
            <div className="mt-5 space-y-3">
              <div className="h-24 rounded-3xl bg-[var(--site-bg-soft)]" />
              <div className="h-24 rounded-3xl bg-[var(--site-bg-soft)]" />
            </div>
          ) : recentAttempts.length === 0 ? (
            <div className="mt-5 rounded-[1.5rem] border border-dashed border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5 text-sm leading-6 text-[var(--site-muted)]">
              Your recent quiz results will appear here after your first checkpoint attempt.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {recentAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex flex-col gap-3 rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-base font-semibold text-[var(--site-text)]">{attempt.lesson.title}</div>
                    <div className="mt-1 text-sm text-[var(--site-muted)]">
                      Score {attempt.score}% and {attempt.passed ? 'passed' : 'still needs another try'}.
                    </div>
                  </div>
                  <div
                    className={cn(
                      'w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]',
                      attempt.passed
                        ? 'bg-[var(--site-success-soft)] text-[var(--site-success)]'
                        : 'bg-[var(--site-warm-soft)] text-[var(--site-warm)]',
                    )}
                  >
                    {attempt.passed ? 'Passed' : 'Retry'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_20px_65px_var(--site-shadow)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--site-subtle)]">
            Profile & shortcuts
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--site-text)]">Your learner profile</h2>

          <div className="mt-6 space-y-4">
            <ProfileRow label="Email" value={me?.email ?? 'Not available'} mono />
            <ProfileRow label="Roles" value={me?.roles?.join(', ') ?? 'student'} mono />
            <ProfileRow label="Interests" value={interestsText} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/dashboard/profile"
              className="rounded-2xl bg-[var(--site-primary)] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--site-primary-strong)]"
            >
              Edit profile
            </Link>
            <Link
              href="/dashboard/courses"
              className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3 text-center text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
            >
              Browse courses
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/dashboard/notifications"
              className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3 text-center text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
            >
              Notifications
            </Link>
            <Link
              href="/dashboard/achievements"
              className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3 text-center text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
            >
              Achievements
            </Link>
          </div>

          {canAccessAdmin ? (
            <div className="mt-6 rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--site-subtle)]">Admin panel</div>
              <p className="mt-2 text-sm leading-6 text-[var(--site-muted)]">
                Manage courses, modules, lessons, quizzes, and media from the admin panel whenever
                you need to update content.
              </p>
              <Link
                href="/admin"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)] transition hover:text-[var(--site-primary-strong)]"
              >
                Open admin panel
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-6">
        <div className="rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_20px_65px_var(--site-shadow)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--site-subtle)]">
            Timeline
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--site-text)] mb-6">Recent Activity</h2>
          
          {activityQuery.isLoading ? (
            <div className="text-sm text-[var(--site-subtle)]">Loading activity...</div>
          ) : activityQuery.data?.length === 0 ? (
            <div className="text-sm text-[var(--site-muted)]">No recent activity yet. Start learning!</div>
          ) : (
            <div className="flex flex-col gap-4">
              {activityQuery.data?.map((activity, i) => (
                <div key={i} className="flex gap-4 items-center pb-4 border-b border-[var(--site-border)] last:border-0 last:pb-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--site-bg-soft)] text-xl">
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--site-text)]">{activity.title}</p>
                    <p className="text-xs text-[var(--site-muted)] mt-1">{new Date(activity.date).toLocaleDateString()}</p>
                  </div>
                  {activity.href && (
                    <Link href={activity.href} className="text-xs font-semibold text-[var(--site-primary)] hover:underline">
                      View
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function MetricPill({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 shadow-[0_18px_40px_var(--site-shadow)]">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--site-subtle)]">{label}</div>
          <div className="mt-1 text-2xl font-semibold text-[var(--site-text)]">{value}</div>
          <div className="mt-1 text-sm text-[var(--site-muted)]">{detail}</div>
        </div>
      </div>
    </div>
  );
}

function SurfaceMiniCard({
  eyebrow,
  title,
  hint,
}: {
  eyebrow: string;
  title: string;
  hint: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--site-subtle)]">{eyebrow}</div>
      <div className="mt-2 text-base font-semibold text-[var(--site-text)]">{title}</div>
      <div className="mt-1 text-sm leading-6 text-[var(--site-muted)]">{hint}</div>
    </div>
  );
}

function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function ProfileRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--site-subtle)]">{label}</div>
      <div className={`mt-1 text-sm text-[var(--site-text)] ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}
