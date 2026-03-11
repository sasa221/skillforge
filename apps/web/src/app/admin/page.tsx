'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { ErrorCard, LoadingGrid } from '@/components/states/state-cards';
import { adminApi } from '@/lib/api/endpoints';

export default function AdminHomePage() {
  const q = useQuery({ queryKey: ['admin', 'overview'], queryFn: adminApi.overview });

  return (
    <main className="container py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="mt-2 text-muted-foreground">Operational overview and content management.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link className="rounded-md border px-3 py-2 hover:bg-muted" href="/admin/skills">
            Skills
          </Link>
          <Link className="rounded-md border px-3 py-2 hover:bg-muted" href="/admin/courses">
            Courses
          </Link>
          <Link className="rounded-md border px-3 py-2 hover:bg-muted" href="/admin/users">
            Users
          </Link>
        </div>
      </div>

      {q.isLoading ? (
        <div className="mt-6">
          <LoadingGrid items={8} />
        </div>
      ) : q.isError ? (
        <div className="mt-6">
          <ErrorCard
            title="Couldn’t load overview"
            message={q.error instanceof Error ? q.error.message : 'Unknown error'}
            onRetry={() => q.refetch()}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card label="Users" value={q.data!.totalUsers} />
          <Card label="Enrollments" value={q.data!.activeEnrollments} />
          <Card label="Skills" value={q.data!.totalSkills} />
          <Card label="Courses" value={q.data!.totalCourses} />
          <Card label="Lessons" value={q.data!.totalLessons} />
          <Card label="Quizzes" value={q.data!.totalQuizzes} />
          <Card label="Quiz attempts" value={q.data!.totalQuizAttempts} />
          <Card label="Completed courses" value={q.data!.completedCourses} />
        </div>
      )}
    </main>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

