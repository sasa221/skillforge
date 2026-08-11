'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  BookOpenText,
  Check,
  Flame,
  Medal,
  Rocket,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';

import { progressApi, gamificationApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/lib/auth/store';
import { cn } from '@/lib/utils';

const BADGE_DEFINITIONS = [
  { key: 'first-lesson', name: 'First Step', icon: '👣', description: 'Complete your first lesson' },
  { key: 'first-quiz', name: 'Quiz Taker', icon: '📝', description: 'Complete your first quiz' },
  { key: 'first-course', name: 'Graduate', icon: '🎓', description: 'Complete your first course' },
  { key: 'quick-learner', name: 'Quick Learner', icon: '⚡', description: 'Complete 5 lessons in one day' },
  { key: 'streak-7', name: '7-Day Streak', icon: '🔥', description: 'Learn 7 days in a row' },
  { key: 'quiz-master', name: 'Quiz Master', icon: '🏆', description: 'Pass 10 quizzes' },
  { key: 'course-collector', name: 'Course Collector', icon: '📚', description: 'Complete 3 courses' },
  { key: 'night-owl', name: 'Night Owl', icon: '🦉', description: 'Complete a lesson after 10pm' },
];

export default function AchievementsPage() {
  const user = useAuthStore((state) => state.user);

  const profileQuery = useQuery({
    queryKey: ['progress', 'profile'],
    queryFn: progressApi.profile,
  });

  const dashboardQuery = useQuery({
    queryKey: ['progress', 'dashboard'],
    queryFn: progressApi.dashboard,
  });

  const leaderboardQuery = useQuery({
    queryKey: ['gamification', 'leaderboard'],
    queryFn: gamificationApi.leaderboard,
  });

  const displayName =
    user?.profile?.fullName ?? user?.email?.split('@')[0] ?? 'SkillForge Learner';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const xp = profileQuery.data?.xp ?? user?.profile?.xp ?? 0;
  const level = profileQuery.data?.level ?? user?.profile?.level ?? 1;
  const stats = profileQuery.data?.stats;
  const streakDays = dashboardQuery.data?.streakDays ?? 0;
  const earnedBadges = profileQuery.data?.badges ?? [];
  const courses = profileQuery.data?.courses ?? [];
  const leaderboard = leaderboardQuery.data ?? [];
  const currentUserLeaderboardEntry = leaderboard.find((entry: any) => entry.userId === user?.id) ?? null;

  const completedCourses =
    stats?.completedCoursesCount ??
    dashboardQuery.data?.completedCoursesCount ??
    courses.filter((course: any) => course.status === 'completed' || course.percent >= 100).length;

  const levelBaseXp = Math.max(0, xp - (xp % 400));
  const nextLevelXp = stats?.nextLevelXp ?? levelBaseXp + 400;
  const levelProgressPercent = stats?.levelProgressPercent ?? Math.min(100, Math.round(((xp - levelBaseXp) / 400) * 100));

  const milestones = [
    {
      key: 'courses',
      title: 'Complete 5 courses',
      description: 'You are building long-form consistency across full learning paths.',
      current: completedCourses,
      target: 5,
      icon: Target,
    },
    {
      key: 'badges',
      title: 'Earn 5 badges',
      description: 'Unlock more achievement signals as you finish lessons and quizzes.',
      current: earnedBadges.length,
      target: 5,
      icon: Award,
    },
    {
      key: 'streak',
      title: 'Maintain a 7-day streak',
      description: 'Daily momentum compounds faster than occasional heavy sessions.',
      current: streakDays,
      target: 7,
      icon: Flame,
    },
    {
      key: 'level',
      title: `Reach level ${level + 1}`,
      description: 'Keep collecting XP to break into the next milestone band.',
      current: xp - levelBaseXp,
      target: nextLevelXp - levelBaseXp,
      icon: Rocket,
    },
  ];

  const weeklyStreak = buildWeeklyStreak(streakDays);
  const topCourses = [...courses].sort((left: any, right: any) => right.percent - left.percent).slice(0, 4);

  if (profileQuery.isLoading || dashboardQuery.isLoading) {
    return (
      <main className="space-y-8 pb-6">
        <div className="h-56 rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
      </main>
    );
  }

  return (
    <main className="space-y-8 pb-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-[var(--site-border)] bg-[radial-gradient(circle_at_top_right,var(--site-primary-soft),transparent_24%),radial-gradient(circle_at_left_bottom,var(--site-warm-soft),transparent_28%),var(--site-surface)] p-6 shadow-[0_28px_80px_var(--site-shadow)] lg:p-8">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(var(--site-border)_1px,transparent_1px),linear-gradient(90deg,var(--site-border)_1px,transparent_1px)] [background-size:50px_50px]" />

        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-center">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="relative mx-auto md:mx-0">
              <div className="flex h-40 w-40 items-center justify-center rounded-full border-4 border-[var(--site-primary)] bg-[radial-gradient(circle_at_top,#f8ecdf_0%,#efd4b2_55%,#dca469_100%)] text-4xl font-semibold text-[var(--site-text)] shadow-[0_18px_40px_var(--site-shadow)]">
                {initials || 'SF'}
              </div>
              <div className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center rounded-[1.3rem] bg-[var(--site-primary)] px-5 py-2 text-white shadow-[0_18px_34px_var(--site-shadow)]">
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">Level</span>
                <span className="text-3xl font-bold leading-none">{level}</span>
              </div>
            </div>

            <div className="flex-1 space-y-5 pt-4 md:pt-0">
              <div>
                <h1 className="text-5xl font-semibold tracking-tight text-[var(--site-text)] md:text-6xl">
                  {displayName}&apos;s Journey
                </h1>
                <p className="mt-3 text-2xl text-[var(--site-muted)]">
                  Level {level} / {earnedBadges.length} badges earned so far
                </p>
              </div>

              <div>
                <div className="h-4 rounded-full bg-[var(--site-border)]">
                  <div
                    className="h-4 rounded-full bg-[var(--site-primary)] transition-all"
                    style={{ width: `${levelProgressPercent}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold">
                  <span className="text-[var(--site-primary)]">{xp.toLocaleString()} XP</span>
                  <span className="text-[var(--site-subtle)]">
                    {nextLevelXp.toLocaleString()} XP to level {level + 1}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            <HeroStatCard
              icon={Medal}
              value={currentUserLeaderboardEntry?.rank ? `#${currentUserLeaderboardEntry.rank}` : 'No rank yet'}
              label="Global rank"
            />
            <HeroStatCard icon={Flame} value={`${streakDays}`} label="Day streak" />
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className="space-y-8">
          <section>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
                  <Trophy className="h-5 w-5" />
                </div>
                <h2 className="text-4xl font-semibold text-[var(--site-text)]">Collected badges</h2>
              </div>
              <span className="text-lg font-semibold text-[var(--site-primary)]">
                {earnedBadges.length} unlocked
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-4">
              {BADGE_DEFINITIONS.map((badgeDef) => {
                const isEarned = earnedBadges.some((b: any) => b.key === badgeDef.key);
                return (
                  <div key={badgeDef.key} className={cn("rounded-[1.8rem] border p-6 text-center shadow-[0_20px_48px_var(--site-shadow)] transition-all", isEarned ? "border-[var(--site-primary)] bg-[var(--site-surface)]" : "border-[var(--site-border)] bg-[var(--site-surface-alt)] opacity-60 grayscale")}>
                    <div className={cn("mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl", isEarned ? "bg-[var(--site-primary-soft)]" : "bg-gray-200 dark:bg-gray-800")}>
                      {badgeDef.icon}
                    </div>
                    <div className="mt-4 text-xl font-semibold text-[var(--site-text)]">{badgeDef.name}</div>
                    <div className="mt-2 text-xs text-[var(--site-muted)]">{badgeDef.description}</div>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
                <Target className="h-5 w-5" />
              </div>
              <h2 className="text-4xl font-semibold text-[var(--site-text)]">Milestones</h2>
            </div>

            <div className="space-y-5">
              {milestones.map((milestone) => (
                <MilestoneCard
                  key={milestone.key}
                  title={milestone.title}
                  description={milestone.description}
                  current={milestone.current}
                  target={milestone.target}
                  icon={milestone.icon}
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_40px_var(--site-shadow)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Flame className="h-7 w-7 text-[var(--site-primary)]" />
                <div className="text-2xl font-semibold text-[var(--site-text)]">Streak</div>
              </div>
              <div className="text-4xl font-semibold text-[var(--site-primary)]">{streakDays} Days</div>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-2">
              {weeklyStreak.map((day) => (
                <div key={day.key} className="space-y-2 text-center">
                  <div
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold',
                      day.active
                        ? 'border-[var(--site-primary)] bg-[var(--site-primary)] text-white'
                        : 'border-[var(--site-border)] bg-[var(--site-surface-alt)] text-[var(--site-subtle)]',
                    )}
                  >
                    {day.label}
                  </div>
                  <div className="flex justify-center">
                    <div
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-full border',
                        day.active
                          ? 'border-[var(--site-primary)] bg-[var(--site-primary)]'
                          : 'border-[var(--site-border)] bg-transparent',
                      )}
                    >
                      {day.active ? <Check className="h-3 w-3 text-white" /> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_40px_var(--site-shadow)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-[var(--site-primary)]" />
                <div className="text-2xl font-semibold text-[var(--site-text)]">Top 5 Leaders</div>
              </div>
            </div>

            <div className="space-y-4">
              {leaderboard.length === 0 ? (
                <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4 text-sm leading-7 text-[var(--site-muted)]">
                  Loading...
                </div>
              ) : (
                leaderboard.slice(0, 5).map((entry: any) => (
                  <div
                    key={entry.userId}
                    className={cn(
                      'flex items-center justify-between gap-4 rounded-2xl border px-4 py-3',
                      entry.userId === user?.id
                        ? 'border-[var(--site-primary)]/35 bg-[var(--site-primary-soft)]'
                        : 'border-[var(--site-border)] bg-[var(--site-surface-alt)]',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 text-sm font-semibold text-[var(--site-subtle)]">#{entry.rank}</div>
                      <div className="font-semibold text-[var(--site-text)]">
                        {entry.fullName}
                        {entry.userId === user?.id ? ' (You)' : ''}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-[var(--site-text)]">
                      {entry.xp.toLocaleString()} XP
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function HeroStatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Medal;
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-5 text-5xl font-semibold text-[var(--site-text)]">{value}</div>
      <div className="mt-2 text-sm uppercase tracking-[0.22em] text-[var(--site-subtle)]">{label}</div>
    </div>
  );
}

function MilestoneCard({
  title,
  description,
  current,
  target,
  icon: Icon,
}: {
  title: string;
  description: string;
  current: number;
  target: number;
  icon: typeof Target;
}) {
  const safeCurrent = Math.max(0, current);
  const safeTarget = Math.max(1, target);
  const percent = Math.min(100, Math.round((safeCurrent / safeTarget) * 100));

  return (
    <div className="rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_20px_48px_var(--site-shadow)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-semibold text-[var(--site-text)]">{title}</div>
            <p className="mt-2 text-sm leading-7 text-[var(--site-muted)]">{description}</p>
          </div>
        </div>
        <div className="text-xl font-semibold text-[var(--site-primary)]">
          {safeCurrent} / {safeTarget}
        </div>
      </div>

      <div className="mt-5 h-3 rounded-full bg-[var(--site-border)]">
        <div className="h-3 rounded-full bg-[var(--site-primary)]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function buildWeeklyStreak(streakDays: number) {
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const activeCount = Math.min(7, streakDays);
  return labels.map((label, index) => ({
    key: `${label}-${index}`,
    label,
    active: index < activeCount,
  }));
}
