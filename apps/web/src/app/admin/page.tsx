'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BookOpenText, Sparkles, Target, Trophy, Users } from 'lucide-react';

import { AdminMetricCard, AdminPageIntro, AdminStatusPill, AdminSurface } from '@/components/admin/AdminUi';
import { adminApi } from '@/lib/api/endpoints';
import type { AdminContentStats, AdminOverview } from '@/lib/content/types';

const emptyStats: AdminContentStats = {
  skills: {},
  courses: {},
  modules: {},
  lessons: {},
  quizzes: {},
};

export default function AdminHomePage() {
  const overviewQuery = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: adminApi.overview,
  });
  const statsQuery = useQuery({
    queryKey: ['admin', 'content-stats'],
    queryFn: adminApi.contentStats,
  });

  if (overviewQuery.isLoading) {
    return (
      <main className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-64 rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]"
            />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
          <div className="h-[29rem] rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
          <div className="h-[29rem] rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
        </div>
      </main>
    );
  }

  if (overviewQuery.isError) {
    return (
      <main className="rounded-[1.8rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
        <div className="font-semibold">Could not load admin overview</div>
        <div className="mt-2 text-[var(--site-danger)]/80">
          {overviewQuery.error instanceof Error ? overviewQuery.error.message : 'Unknown error'}
        </div>
      </main>
    );
  }

  const overview = overviewQuery.data!;
  const stats = statsQuery.data ?? emptyStats;
  const completionRate = Math.min(
    100,
    Math.round((overview.completedCourses / Math.max(1, overview.activeEnrollments)) * 100),
  );
  const metricCards = [
    {
      title: 'Total Users',
      value: formatNumber(overview.totalUsers),
      detail: 'Registered learners and admins',
      icon: Users,
      tone: 'blue' as const,
    },
    {
      title: 'Enrollments',
      value: formatNumber(overview.activeEnrollments),
      detail: 'Active learning seats across the library',
      icon: BookOpenText,
      tone: 'orange' as const,
    },
    {
      title: 'Quiz Attempts',
      value: formatNumber(overview.totalQuizAttempts),
      detail: 'Recorded checkpoint and quiz submissions',
      icon: Sparkles,
      tone: 'violet' as const,
    },
    {
      title: 'Completed Courses',
      value: formatNumber(overview.completedCourses),
      detail: `${completionRate}% completion`,
      icon: Trophy,
      tone: 'emerald' as const,
    },
  ];

  const chartData = [
    { label: 'Users', value: overview.totalUsers },
    { label: 'Enrollments', value: overview.activeEnrollments },
    { label: 'Skills', value: overview.totalSkills },
    { label: 'Courses', value: overview.totalCourses },
    { label: 'Lessons', value: overview.totalLessons },
    { label: 'Quizzes', value: overview.totalQuizzes },
  ];

  const highlights = buildHighlights(overview, stats);
  const healthRows = [
    {
      label: 'Enrollment coverage',
      percent: Math.min(100, Math.round((overview.activeEnrollments / Math.max(1, overview.totalUsers)) * 100)),
              meta: `${overview.activeEnrollments} active enrollments`,
      tone: 'emerald' as const,
    },
    {
      label: 'Course completion rate',
      percent: completionRate,
      meta: `${overview.completedCourses} completed courses`,
      tone: 'orange' as const,
    },
    {
      label: 'Assessment density',
      percent: Math.min(100, Math.round((overview.totalQuizAttempts / Math.max(1, overview.totalUsers)) * 100)),
      meta: `${overview.totalQuizAttempts} total attempts`,
      tone: 'blue' as const,
    },
  ];

  return (
    <main className="space-y-6">
      <AdminPageIntro
        title="Admin Overview"
        description="Platform totals, learner activity, and course management in one place."
        actions={
          <>
            <Link
              href="/admin/courses"
              className="inline-flex h-14 items-center justify-center rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 text-lg font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
            >
              Manage courses
            </Link>
            <Link
              href="/admin/skills"
              className="inline-flex h-14 items-center justify-center rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 text-lg font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
            >
              Manage skills
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.2rem] border border-primary/20 bg-primary/10 px-5 text-lg font-semibold text-primary transition hover:bg-primary/15"
            >
              <Users className="h-5 w-5" />
              Review Learners
            </Link>
          </>
        }
      />

      <section className="grid gap-4 lg:grid-cols-4">
        {metricCards.map((card) => (
          <AdminMetricCard key={card.title} {...card} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
        <AdminSurface>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-4xl font-semibold text-[var(--site-text)]">Platform Activity Curve</h2>
              <p className="mt-2 text-lg text-[var(--site-muted)]">
                How learners, courses, and assessments are moving across the platform.
              </p>
            </div>
            <AdminStatusPill tone="slate">Current totals</AdminStatusPill>
          </div>

          <div className="mt-8">
            <OverviewChart data={chartData} />
          </div>
        </AdminSurface>

        <AdminSurface>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-4xl font-semibold text-[var(--site-text)]">Completion Metrics</h2>
              <p className="mt-2 text-lg text-[var(--site-muted)]">Progress through active enrollments.</p>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <div
              className="flex h-56 w-56 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(var(--site-primary) 0 ${completionRate}%, var(--site-border) ${completionRate}% 100%)`,
              }}
            >
              <div className="flex h-[170px] w-[170px] flex-col items-center justify-center rounded-full bg-[var(--site-surface)]">
                <div className="text-6xl font-semibold text-[var(--site-text)]">{completionRate}%</div>
                <div className="mt-2 text-center text-sm uppercase tracking-[0.2em] text-[var(--site-subtle)]">
                  Avg. Course Rate
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4 text-lg">
            <div className="flex items-center justify-between text-[var(--site-muted)]">
              <span>Completed</span>
              <span className="font-semibold text-[var(--site-text)]">{formatNumber(overview.completedCourses)}</span>
            </div>
            <div className="flex items-center justify-between text-[var(--site-muted)]">
              <span>In Progress</span>
              <span className="font-semibold text-[var(--site-text)]">
                {formatNumber(Math.max(0, overview.activeEnrollments - overview.completedCourses))}
              </span>
            </div>
          </div>
        </AdminSurface>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
        <AdminSurface>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-4xl font-semibold text-[var(--site-text)]">Recent Admin Focus</h2>
              <p className="mt-2 text-lg text-[var(--site-muted)]">
                The updates and shifts that deserve your attention right now.
              </p>
            </div>
            <Link href="/admin/skills" className="text-lg font-semibold text-primary">
              Open skill library
            </Link>
          </div>

          <div className="mt-8 divide-y divide-[var(--site-border)]">
            {highlights.map((highlight) => (
              <div key={highlight.title} className="flex items-start gap-4 py-5 first:pt-0 last:pb-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <highlight.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-2xl font-semibold text-[var(--site-text)]">{highlight.title}</div>
                  <div className="mt-2 text-lg leading-8 text-[var(--site-muted)]">{highlight.description}</div>
                  <div className="mt-2 text-sm uppercase tracking-[0.18em] text-[var(--site-subtle)]">
                    {highlight.meta}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdminSurface>

        <AdminSurface>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-4xl font-semibold text-[var(--site-text)]">System Health</h2>
              <p className="mt-2 text-lg text-[var(--site-muted)]">
                Coverage and completion signals across your platform right now.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {healthRows.map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-xl text-[var(--site-muted)]">{row.label}</div>
                  <div className="text-lg font-semibold text-[var(--site-text)]">{row.meta}</div>
                </div>
                <div className="mt-3 h-3 rounded-full bg-[var(--site-border)]">
                  <div
                    className={
                      row.tone === 'emerald'
                        ? 'h-3 rounded-full bg-emerald-400'
                        : row.tone === 'blue'
                          ? 'h-3 rounded-full bg-sky-400'
                          : 'h-3 rounded-full bg-primary'
                    }
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </AdminSurface>
      </section>
    </main>
  );
}

function OverviewChart({
  data,
}: {
  data: Array<{ label: string; value: number }>;
}) {
  const width = 880;
  const height = 360;
  const paddingX = 36;
  const chartHeight = 240;
  const baseLine = 300;
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const stepX = (width - paddingX * 2) / Math.max(1, data.length - 1);

  const points = data.map((item, index) => {
    const x = paddingX + index * stepX;
    const y = baseLine - Math.round((item.value / maxValue) * chartHeight);
    return { ...item, x, y };
  });

  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPoints = `${paddingX},${baseLine} ${polyline} ${paddingX + stepX * (data.length - 1)},${baseLine}`;

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <defs>
          <linearGradient id="overview-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(47,155,255,0.32)" />
            <stop offset="100%" stopColor="rgba(47,155,255,0.03)" />
          </linearGradient>
        </defs>

        {Array.from({ length: 5 }).map((_, index) => {
          const y = 60 + index * 60;
          return (
            <line
              key={index}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="rgba(148, 169, 197, 0.22)"
              strokeWidth="1"
            />
          );
        })}

        <polygon points={areaPoints} fill="url(#overview-area)" />
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--site-primary)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="8" fill="var(--site-primary)" />
            <circle cx={point.x} cy={point.y} r="14" fill="rgba(47,155,255,0.16)" />
            <text x={point.x} y={340} textAnchor="middle" fill="var(--site-subtle)" fontSize="18">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function buildHighlights(overview: AdminOverview, stats: AdminContentStats) {
  const topSkill = Object.entries(stats.skills).sort((left, right) => right[1] - left[1])[0];
  const topCourse = Object.entries(stats.courses).sort((left, right) => right[1] - left[1])[0];

  return [
    {
      title: 'Skill library coverage',
      description: topSkill
        ? `${topSkill[0]} currently leads the skill matrix with ${formatNumber(topSkill[1])} mapped items.`
        : `${formatNumber(overview.totalSkills)} skill categories are available for curriculum planning.`,
      meta: 'Skill coverage',
      icon: Sparkles,
    },
    {
      title: 'Course catalog pressure',
      description: topCourse
        ? `${topCourse[0]} is carrying the strongest course volume with ${formatNumber(topCourse[1])} entries.`
        : `${formatNumber(overview.totalCourses)} courses are active inside the platform.`,
      meta: 'Course distribution',
      icon: BookOpenText,
    },
    {
      title: 'Assessment activity',
      description: `${formatNumber(overview.totalQuizAttempts)} quiz attempts and ${formatNumber(overview.totalQuizzes)} quizzes are fueling learner validation.`,
      meta: 'Assessment load',
      icon: Target,
    },
  ];
}

function formatNumber(value: number) {
  return value.toLocaleString();
}
