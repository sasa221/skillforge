'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/toast/toast-provider';
import { coursesApi, enrollmentsApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/lib/auth/store';

export function CourseDetailsClient({ slug }: { slug: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();

  const q = useQuery({
    queryKey: ['courses', 'bySlug', slug],
    queryFn: () => coursesApi.bySlug(slug),
  });

  const enroll = useMutation({
    mutationFn: async () => {
      if (!q.data) throw new Error('Course not loaded');
      return enrollmentsApi.enroll(q.data.id);
    },
    onSuccess: (enrollment) => {
      toast({ title: 'Enrolled', description: 'Redirecting you to your dashboard course page.' });
      router.push(`/dashboard/courses/${enrollment.course.slug}`);
    },
    onError: (e) => {
      toast({
        title: 'Enrollment failed',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  return (
    <main className="container py-10">
      <Link className="text-sm text-muted-foreground hover:text-foreground" href="/courses">
        ← Back to courses
      </Link>

      {q.isLoading ? (
        <div className="mt-6 space-y-3">
          <div className="h-8 w-3/4 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
      ) : q.isError ? (
        <div className="mt-6 rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm font-medium">Couldn’t load course</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {q.error instanceof Error ? q.error.message : 'Unknown error'}
          </div>
        </div>
      ) : !q.data ? (
        <div className="mt-6 rounded-xl border bg-card p-5 shadow-sm text-sm text-muted-foreground">
          Course not found.
        </div>
      ) : (
        <>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{q.data.title}</h1>
          {q.data.description ? (
            <p className="mt-2 text-muted-foreground">{q.data.description}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full border bg-background px-2 py-0.5 uppercase tracking-wide">
              {q.data.difficulty}
            </span>
            {q.data.estimatedMinutes ? (
              <span className="rounded-full border bg-background px-2 py-0.5">
                {q.data.estimatedMinutes} min
              </span>
            ) : null}
            {q.data.skills.map((s) => (
              <span
                key={s.id}
                className="rounded-full border bg-background px-2 py-0.5"
              >
                {s.skill.title}
              </span>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold">Curriculum</h2>
              <div className="mt-3 space-y-4">
                {q.data.modules.map((m) => (
                  <div key={m.id} className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="text-sm text-muted-foreground">Module</div>
                    <div className="mt-1 font-medium">{m.title}</div>
                    {m.description ? (
                      <div className="mt-2 text-sm text-muted-foreground">{m.description}</div>
                    ) : null}
                    <div className="mt-3 space-y-2">
                      {m.lessons.map((l) => (
                        <div key={l.id} className="flex items-center justify-between gap-4">
                          <div className="text-sm">{l.title}</div>
                          {l.estimatedMinutes ? (
                            <div className="text-xs text-muted-foreground">
                              {l.estimatedMinutes} min
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="text-sm font-medium">Start learning</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Enroll to access lessons in your dashboard. After you complete 1–2 lessons, your dashboard will show XP, badges, and a “Continue learning” link.
              </p>

              <div className="mt-4 space-y-2">
                {user ? (
                  <Button
                    className="w-full"
                    onClick={() => enroll.mutate()}
                    disabled={enroll.isPending}
                  >
                    {enroll.isPending ? 'Enrolling…' : 'Enroll now'}
                  </Button>
                ) : (
                  <>
                    <Link href={`/login?next=${encodeURIComponent(`/courses/${slug}`)}`}>
                      <Button className="w-full">Login to enroll</Button>
                    </Link>
                    <Link href={`/signup?next=${encodeURIComponent(`/courses/${slug}`)}`}>
                      <Button variant="outline" className="w-full">
                        Create account
                      </Button>
                    </Link>
                  </>
                )}
                {enroll.isError ? (
                  <div className="rounded-md border bg-muted p-3 text-sm">
                    {enroll.error instanceof Error ? enroll.error.message : 'Enroll failed'}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

