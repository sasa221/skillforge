'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/endpoints';
import { AdminPageIntro, AdminMetricCard, AdminSurface } from '@/components/admin/AdminUi';
import { Users, BookOpenText, Target, Trophy, MessageSquare, TrendingUp, UserPlus } from 'lucide-react';

function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}

export default function AnalyticsPage() {
  const query = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: adminApi.analytics,
  });

  if (query.isLoading) {
    return (
      <main className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]"
            />
          ))}
        </div>
      </main>
    );
  }

  if (query.isError || !query.data) {
    return (
      <main className="rounded-[1.8rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
        <div className="font-semibold">Could not load admin analytics</div>
        <div className="mt-2 text-[var(--site-danger)]/80">
          {query.error instanceof Error ? query.error.message : 'Unknown error'}
        </div>
      </main>
    );
  }

  const data = query.data;
  const maxSignupCount = Math.max(...data.charts.dailySignups.map((d: any) => d.count), 1);
  const maxEnrollmentCount = Math.max(...data.charts.dailyEnrollments.map((d: any) => d.count), 1);

  return (
    <main className="space-y-8">
      <AdminPageIntro
        title="Platform Analytics"
        description="Detailed insights and metrics across the entire platform"
      />

      <section>
        <h2 className="mb-4 text-xl font-semibold">Platform Totals</h2>
        <div className="grid gap-4 lg:grid-cols-4">
          <AdminMetricCard
            title="Total Users"
            value={formatNumber(data.totals.totalUsers)}
            detail="Registered accounts"
            icon={Users}
            tone="blue"
          />
          <AdminMetricCard
            title="Total Courses"
            value={formatNumber(data.totals.totalCourses)}
            detail="Published courses"
            icon={BookOpenText}
            tone="violet"
          />
          <AdminMetricCard
            title="Total Enrollments"
            value={formatNumber(data.totals.totalEnrollments)}
            detail="Active and past"
            icon={Target}
            tone="orange"
          />
          <AdminMetricCard
            title="Certificates"
            value={formatNumber(data.totals.totalCertificates)}
            detail="Issued to learners"
            icon={Trophy}
            tone="emerald"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">30-Day Trends</h2>
        <div className="grid gap-4 lg:grid-cols-4">
          <AdminMetricCard
            title="New Users"
            value={formatNumber(data.trends.newUsersLast30)}
            detail="Last 30 days"
            icon={UserPlus}
            tone="blue"
          />
          <AdminMetricCard
            title="New Enrollments"
            value={formatNumber(data.trends.newEnrollmentsLast30)}
            detail="Last 30 days"
            icon={TrendingUp}
            tone="orange"
          />
          <AdminMetricCard
            title="Active Learners"
            value={formatNumber(data.trends.activeUsersLast7)}
            detail="Last 7 days"
            icon={Users}
            tone="emerald"
          />
          <AdminMetricCard
            title="AI Messages"
            value={formatNumber(data.trends.aiMessageCount)}
            detail="Last 30 days"
            icon={MessageSquare}
            tone="violet"
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminSurface className="flex flex-col gap-6 p-6">
          <div>
            <h3 className="font-semibold text-[var(--site-text)]">Daily Signups (Last 14 Days)</h3>
          </div>
          <div className="flex items-end gap-1 h-48 mt-auto pt-8 pb-4">
            {data.charts.dailySignups.map(({ date, count }: any) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div
                  className="w-full rounded-t bg-[var(--site-primary)] min-h-[4px] transition-all hover:opacity-80"
                  style={{ height: `${Math.max(2, (count / maxSignupCount) * 100)}%` }}
                  title={`${date}: ${count}`}
                />
                <span className="text-[10px] text-[var(--site-muted)] -rotate-45 origin-top-left mt-2 whitespace-nowrap block w-full text-center">
                  {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </AdminSurface>

        <AdminSurface className="flex flex-col gap-6 p-6">
          <div>
            <h3 className="font-semibold text-[var(--site-text)]">Daily Enrollments (Last 14 Days)</h3>
          </div>
          <div className="flex items-end gap-1 h-48 mt-auto pt-8 pb-4">
            {data.charts.dailyEnrollments.map(({ date, count }: any) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div
                  className="w-full rounded-t bg-orange-500 min-h-[4px] transition-all hover:opacity-80"
                  style={{ height: `${Math.max(2, (count / maxEnrollmentCount) * 100)}%` }}
                  title={`${date}: ${count}`}
                />
                <span className="text-[10px] text-[var(--site-muted)] -rotate-45 origin-top-left mt-2 whitespace-nowrap block w-full text-center">
                  {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </AdminSurface>
      </div>

      <section>
        <AdminSurface className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Top 5 Enrolled Courses</h2>
          <div className="divide-y divide-[var(--site-border)]">
            {data.topCourses.map((course: any, idx: number) => (
              <div key={course.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--site-surface-alt)] text-sm font-medium">
                    {idx + 1}
                  </div>
                  <div className="font-medium">{course.title}</div>
                </div>
                <div className="text-sm font-semibold text-[var(--site-muted)]">
                  {formatNumber(course._count.enrollments)} enrollments
                </div>
              </div>
            ))}
            {data.topCourses.length === 0 && (
              <div className="py-4 text-sm text-[var(--site-muted)]">No courses found.</div>
            )}
          </div>
        </AdminSurface>
      </section>
    </main>
  );
}
