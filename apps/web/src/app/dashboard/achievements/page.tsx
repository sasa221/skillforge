'use client';

import { useQuery } from '@tanstack/react-query';

import { progressApi } from '@/lib/api/endpoints';

export default function AchievementsPage() {
  const q = useQuery({ queryKey: ['progress', 'profile'], queryFn: progressApi.profile });

  return (
    <main className="container py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Achievements</h1>
      <p className="mt-2 text-muted-foreground">Badges and achievements you’ve unlocked.</p>

      {q.isLoading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl border bg-card p-5 shadow-sm" />
          ))}
        </div>
      ) : q.isError ? (
        <div className="mt-6 rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm font-medium">Couldn’t load achievements</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {q.error instanceof Error ? q.error.message : 'Unknown error'}
          </div>
        </div>
      ) : !q.data ? (
        <div className="mt-6 rounded-xl border bg-card p-5 shadow-sm text-sm text-muted-foreground">
          No achievements yet.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="text-sm font-medium">Badges</div>
            {(q.data.badges?.length ?? 0) === 0 ? (
              <div className="mt-2 text-sm text-muted-foreground">No badges yet.</div>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {q.data.badges.map((b) => (
                  <li key={b.key} className="flex items-center justify-between gap-3">
                    <span>{b.title}</span>
                    <span className="text-xs text-muted-foreground">{b.key}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="text-sm font-medium">Achievements</div>
            {(q.data.achievements?.length ?? 0) === 0 ? (
              <div className="mt-2 text-sm text-muted-foreground">No achievements yet.</div>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {q.data.achievements.map((a) => (
                  <li key={a.type} className="space-y-1">
                    <div className="text-sm">{a.title}</div>
                    {a.description ? (
                      <div className="text-xs text-muted-foreground">{a.description}</div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

