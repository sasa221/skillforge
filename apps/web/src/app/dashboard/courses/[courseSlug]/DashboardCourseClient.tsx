'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { enrollmentsApi, progressApi } from '@/lib/api/endpoints';

export function DashboardCourseClient({ courseSlug }: { courseSlug: string }) {
  const q = useQuery({ queryKey: ['enrollments', 'me'], queryFn: enrollmentsApi.me });

  const enrollment = useMemo(() => {
    if (!q.data) return null;
    return q.data.find((e) => e.course.slug === courseSlug) ?? null;
  }, [courseSlug, q.data]);

  if (q.isLoading) {
    return (
      <main className="container py-10">
        <div className="h-8 w-1/2 rounded bg-muted" />
        <div className="mt-4 h-24 rounded-xl border bg-card p-5 shadow-sm" />
      </main>
    );
  }

  if (q.isError) {
    return (
      <main className="container py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Course</h1>
        <div className="mt-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm font-medium">Couldn’t load your enrollments</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {q.error instanceof Error ? q.error.message : 'Unknown error'}
          </div>
        </div>
      </main>
    );
  }

  if (!enrollment) {
    return (
      <main className="container py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Course</h1>
        <p className="mt-2 text-muted-foreground">You’re not enrolled in this course.</p>
        <div className="mt-4 flex gap-3 text-sm">
          <Link className="rounded-md border px-3 py-2 hover:bg-muted" href="/courses">
            Browse courses
          </Link>
          <Link className="rounded-md border px-3 py-2 hover:bg-muted" href={`/courses/${courseSlug}`}>
            View course page
          </Link>
        </div>
      </main>
    );
  }

  const course = enrollment.course;
  const firstLesson = course.modules[0]?.lessons[0] ?? null;
  const progress = useQuery({
    queryKey: ['progress', 'course', course.id],
    queryFn: () => progressApi.course(course.id),
  });

  return (
    <main className="container py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
          {course.description ? (
            <p className="mt-2 text-muted-foreground">{course.description}</p>
          ) : null}
        </div>
        {firstLesson ? (
          <Link
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
            href={`/dashboard/lessons/${firstLesson.slug}`}
          >
            Start / continue
          </Link>
        ) : null}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <aside className="rounded-xl border bg-card p-5 shadow-sm lg:order-2">
          <div className="text-sm font-medium">Modules</div>
          <div className="mt-3 space-y-4">
            {(progress.data?.modules ?? course.modules.map((m) => ({
              id: m.id,
              title: m.title,
              order: m.order,
              percent: 0,
              lessons: m.lessons.map((l) => ({ ...l, completed: false })),
            }))).map((m) => (
              <div key={m.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">{m.title}</div>
                  <div className="text-xs text-muted-foreground">{m.percent}%</div>
                </div>
                <div className="space-y-1">
                  {m.lessons.map((l) => (
                    <Link
                      key={l.id}
                      href={`/dashboard/lessons/${l.slug}`}
                      className="block rounded-md px-2 py-1 text-sm hover:bg-muted"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span>{l.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {l.completed ? 'Done' : '—'}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="lg:col-span-2">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="text-sm font-medium">Course overview</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Overall progress: <span className="font-mono">{progress.data?.percent ?? 0}%</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

