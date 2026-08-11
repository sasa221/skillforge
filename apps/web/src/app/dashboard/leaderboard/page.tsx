'use client';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Zap, Flame } from 'lucide-react';
import { gamificationApi } from '@/lib/api/endpoints';

export default function LeaderboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: gamificationApi.leaderboard,
  });
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[var(--site-text)] flex items-center gap-3">
        <Trophy className="h-8 w-8 text-yellow-500" /> Leaderboard
      </h1>
      
      {isLoading ? (
        <div>Loading leaderboard...</div>
      ) : isError ? (
        <div className="text-[var(--site-danger)]">Failed to load leaderboard. Gamification API might not be implemented yet.</div>
      ) : data?.length === 0 ? (
        <div>No entries yet.</div>
      ) : (
        <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] overflow-hidden">
          <table className="w-full text-left text-sm text-[var(--site-text)]">
            <thead className="bg-[var(--site-surface-alt)] uppercase text-[var(--site-subtle)] text-xs border-b border-[var(--site-border)]">
              <tr>
                <th className="px-6 py-4 font-semibold text-center w-20">Rank</th>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Level</th>
                <th className="px-6 py-4 font-semibold">Total XP</th>
                <th className="px-6 py-4 font-semibold">Streak</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((entry: any, i: number) => (
                <tr key={entry.userId} className="border-b border-[var(--site-border)] last:border-0 hover:bg-[var(--site-surface-alt)]">
                  <td className="px-6 py-4 font-bold text-center">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </td>
                  <td className="px-6 py-4 font-semibold">{entry.name || 'Anonymous'}</td>
                  <td className="px-6 py-4">{entry.level}</td>
                  <td className="px-6 py-4 text-[var(--site-primary)] font-semibold flex items-center gap-1">
                    <Zap className="h-4 w-4" /> {entry.xp}
                  </td>
                  <td className="px-6 py-4">
                    {entry.streak > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[var(--site-warm)] font-semibold">
                        <Flame className="h-4 w-4" /> {entry.streak} days
                      </span>
                    ) : (
                      <span className="text-[var(--site-subtle)]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
