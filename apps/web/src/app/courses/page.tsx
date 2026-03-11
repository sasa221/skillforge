'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { coursesApi } from '@/lib/api/endpoints';

export default function CoursesCatalogPage() {
  const q = useQuery({ queryKey: ['courses', 'published'], queryFn: coursesApi.list });

  return (
    <main className="container py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
          <p className="mt-2 text-muted-foreground">Browse interactive courses and start learning.</p>
        </div>
      </div>

      {q.isLoading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl border bg-card p-5 shadow-sm" />
          ))}
        </div>
      ) : q.isError ? (
        <div className="mt-8 rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm font-medium">Couldn’t load courses</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {q.error instanceof Error ? q.error.message : 'Unknown error'}
          </div>
        </div>
      ) : (q.data?.length ?? 0) === 0 ? (
        <div className="mt-8 rounded-xl border bg-card p-5 shadow-sm text-sm text-muted-foreground">
          No courses published yet.
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(q.data ?? []).map((c) => (
            <Link
              key={c.id}
              href={`/courses/${c.slug}`}
              className="rounded-xl border bg-card p-5 shadow-sm hover:bg-muted"
            >
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="uppercase tracking-wide">{c.difficulty}</span>
                {c.estimatedMinutes ? <span>{c.estimatedMinutes} min</span> : null}
              </div>
              <div className="mt-2 font-medium">{c.title}</div>
              {c.description ? (
                <div className="mt-2 line-clamp-3 text-sm text-muted-foreground">{c.description}</div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {c.skills.map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full border bg-background px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {s.skill.title}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

