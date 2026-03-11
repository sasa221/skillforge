'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api/client';
import { progressApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/lib/auth/store';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    initialData: user ?? undefined,
  });

  const me = meQuery.data;
  const dashQuery = useQuery({ queryKey: ['progress', 'dashboard'], queryFn: progressApi.dashboard });
  const dash = dashQuery.data;

  return (
    <main className="container py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Welcome back.</p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              await authApi.logout();
            } finally {
              clearSession();
              window.location.href = '/login';
            }
          }}
        >
          Logout
        </Button>
      </div>

      {meQuery.isError ? (
        <div className="mt-6 rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm font-medium">Couldn’t load your session</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {meQuery.error instanceof Error ? meQuery.error.message : 'Unknown error'}
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">Signed in as</div>
          <div className="mt-1 font-medium">{me?.email}</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Roles: <span className="font-mono">{me?.roles?.join(', ')}</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">Progress</div>
          <div className="mt-2 text-sm">
            XP: <span className="font-mono">{dash?.xp ?? me?.profile?.xp ?? 0}</span>
          </div>
          <div className="mt-1 text-sm">
            Level: <span className="font-mono">{dash?.level ?? me?.profile?.level ?? 1}</span>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Completed lessons: <span className="font-mono">{dash?.completedLessonsCount ?? 0}</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">Interests</div>
          <div className="mt-2 text-sm">
            {(me?.profile?.interests ?? []).length > 0 ? (
              <span className="font-mono">{me?.profile?.interests.join(', ')}</span>
            ) : (
              <span className="text-muted-foreground">Not set yet</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm font-medium">Continue learning</div>
          {dashQuery.isLoading ? (
            <div className="mt-2 text-sm text-muted-foreground">Loading…</div>
          ) : dash?.continueLesson ? (
            <div className="mt-3">
              <div className="text-sm text-muted-foreground">{dash.continueLesson.courseTitle}</div>
              <Link
                className="mt-2 inline-block rounded-md border px-3 py-2 text-sm hover:bg-muted"
                href={`/dashboard/lessons/${dash.continueLesson.slug}`}
              >
                Continue: {dash.continueLesson.title}
              </Link>
            </div>
          ) : (
            <div className="mt-2 text-sm text-muted-foreground">
              Enroll in a course to start learning.
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm font-medium">Recent achievements</div>
          {dashQuery.isLoading ? (
            <div className="mt-2 text-sm text-muted-foreground">Loading…</div>
          ) : (dash?.recentBadges?.length ?? 0) > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {dash!.recentBadges.map((b) => (
                <li key={b.key} className="flex items-center justify-between gap-3">
                  <span>{b.title}</span>
                  <span className="text-xs text-muted-foreground">{b.key}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 text-sm text-muted-foreground">No badges yet. Complete a lesson to earn one.</div>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link className="rounded-md border px-3 py-2 hover:bg-muted" href="/dashboard/courses">
          My courses
        </Link>
        <Link className="rounded-md border px-3 py-2 hover:bg-muted" href="/dashboard/profile">
          Edit profile
        </Link>
        <Link className="rounded-md border px-3 py-2 hover:bg-muted" href="/admin">
          Admin
        </Link>
      </div>
    </main>
  );
}

