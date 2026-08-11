'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, BarChart3, CheckCircle2, ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';

import { AdminSurface } from '@/components/admin/AdminUi';
import { instructorWorkspaceApi } from '@/lib/api/endpoints';
import { headingFont } from '@/lib/fonts';
import { cn } from '@/lib/utils';

export default function InstructorAnalyticsPage() {
  const { data: analytics, isLoading, isError, error } = useQuery({
    queryKey: ['instructor', 'analytics'],
    queryFn: instructorWorkspaceApi.analytics,
  });

  if (isLoading) {
    return (
      <main className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-40 rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface)]"
            />
          ))}
        </div>
        <div className="h-[28rem] rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
      </main>
    );
  }

  if (isError || !analytics) {
    return (
      <main className="rounded-[1.8rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
        <div className="font-semibold">Could not load analytics</div>
        <div className="mt-2 text-[var(--site-danger)]/80">
          {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="mb-6">
        <Link
          href="/instructor"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-muted)] transition hover:text-[var(--site-text)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workspace
        </Link>
      </div>
      <div className="mb-8">
        <h1
          className={cn(
            'text-4xl font-extrabold tracking-tight text-[var(--site-text)]',
            headingFont.className,
          )}
        >
          Analytics
        </h1>
        <p className="mt-3 text-lg text-[var(--site-muted)]">
          Overview of learner progress and engagement across your courses.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <WorkspaceStat
          icon={Users}
          label="Total Students"
          value={analytics.totalStudents}
          helper="Across all courses"
        />
        <WorkspaceStat
          icon={BookOpen}
          label="Total Enrollments"
          value={analytics.totalEnrollments}
          helper="Total active enrollments"
        />
        <WorkspaceStat
          icon={CheckCircle2}
          label="Avg Completion Rate"
          value={`${analytics.avgCompletionRate}%`}
          helper="Lesson completion average"
        />
        <WorkspaceStat
          icon={BarChart3}
          label="Avg Quiz Pass Rate"
          value={`${analytics.avgQuizPassRate}%`}
          helper="Passing score average"
        />
      </section>

      <section className="mt-8">
        <AdminSurface>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-[var(--site-text)]">Course Performance</h2>
            <p className="mt-2 text-base text-[var(--site-muted)]">
              Detailed breakdown of metrics per course.
            </p>
          </div>

          {analytics.courseStats.length === 0 ? (
            <div className="rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5 text-base leading-7 text-[var(--site-muted)]">
              No courses found. Once you publish courses and students enroll, their stats will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]">
              <table className="w-full text-left text-sm text-[var(--site-text)]">
                <thead className="bg-[var(--site-surface)] text-xs uppercase tracking-wider text-[var(--site-subtle)]">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Course Title</th>
                    <th className="px-6 py-4 font-semibold">Enrolled</th>
                    <th className="px-6 py-4 font-semibold">Completion %</th>
                    <th className="px-6 py-4 font-semibold">Quiz Pass %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--site-border)]">
                  {analytics.courseStats.map((course: any) => (
                    <tr key={course.courseId} className="transition hover:bg-[var(--site-surface)]">
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-[var(--site-text)]">
                        {course.title}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">{course.enrolled}</td>
                      <td className="whitespace-nowrap px-6 py-4">{course.avgCompletionRate}%</td>
                      <td className="whitespace-nowrap px-6 py-4">{course.quizPassRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminSurface>
      </section>
    </main>
  );
}

function WorkspaceStat({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: number | string;
  helper: string;
}) {
  return (
    <AdminSurface className="p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
        {label}
      </div>
      <div className="mt-3 text-4xl font-semibold tracking-tight text-[var(--site-text)]">
        {value}
      </div>
      <div className="mt-3 text-base text-[var(--site-muted)]">{helper}</div>
    </AdminSurface>
  );
}
