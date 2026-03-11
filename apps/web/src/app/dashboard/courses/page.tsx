'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { enrollmentsApi, progressApi } from '@/lib/api/endpoints';

export default function DashboardCoursesPage() {
  const q = useQuery({ queryKey: ['enrollments', 'me'], queryFn: enrollmentsApi.me });

  return (
    <main className="container py-10">
      <h1 className="text-2xl font-semibold tracking-tight">My courses</h1>
      <p className="mt-2 text-muted-foreground">Your enrolled courses.</p>

      {q.isLoading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl border bg-card p-5 shadow-sm" />
          ))}
        </div>
      ) : q.isError ? (
        <div className="mt-6 rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm font-medium">Couldn’t load your courses</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {q.error instanceof Error ? q.error.message : 'Unknown error'}
          </div>
        </div>
      ) : (q.data?.length ?? 0) === 0 ? (
        <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium">No enrollments yet</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse the catalog and enroll in a course to start learning.
          </p>
          <div className="mt-4">
            <Link className="rounded-md border px-3 py-2 text-sm hover:bg-muted" href="/courses">
              Discover courses
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(q.data ?? []).map((e) => (
            <CourseCard key={e.id} courseId={e.course.id} slug={e.course.slug} title={e.course.title} description={e.course.description} difficulty={e.course.difficulty} estimatedMinutes={e.course.estimatedMinutes} skills={e.course.skills} />
          ))}
        </div>
      )}
    </main>
  );
}

function CourseCard(props: {
  courseId: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: string;
  estimatedMinutes: number | null;
  skills: Array<{ id: string; skill: { title: string } }>;
}) {
  const p = useQuery({
    queryKey: ['progress', 'course', props.courseId],
    queryFn: () => progressApi.course(props.courseId),
  });

  return (
    <Link
      href={`/dashboard/courses/${props.slug}`}
      className="rounded-xl border bg-card p-5 shadow-sm hover:bg-muted"
    >
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="uppercase tracking-wide">{props.difficulty}</span>
        {props.estimatedMinutes ? <span>{props.estimatedMinutes} min</span> : null}
      </div>
      <div className="mt-2 font-medium">{props.title}</div>
      {props.description ? (
        <div className="mt-2 line-clamp-3 text-sm text-muted-foreground">{props.description}</div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {props.skills.map((s) => (
          <span
            key={s.id}
            className="rounded-full border bg-background px-2 py-0.5 text-xs text-muted-foreground"
          >
            {s.skill.title}
          </span>
        ))}
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        Progress: <span className="font-mono">{p.data?.percent ?? 0}%</span>
      </div>
    </Link>
  );
}

