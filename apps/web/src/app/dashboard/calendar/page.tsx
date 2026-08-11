'use client';

import { useEffect, useState } from 'react';
import { progressApi } from '@/lib/api/endpoints';
import { GlassCard } from '@/components/ui/card';
import { DashboardProgress } from '@/lib/content/types';

export default function CalendarPage() {
  const [heatmap, setHeatmap] = useState<{ date: string; count: number }[]>([]);
  const [dashboard, setDashboard] = useState<DashboardProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      progressApi.activityHeatmap(),
      progressApi.dashboard(),
    ]).then(([heatmapRes, dashboardRes]) => {
      setHeatmap(heatmapRes);
      setDashboard(dashboardRes);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  // Build grid data
  const today = new Date();
  const startDay = new Date(today);
  startDay.setDate(today.getDate() - 364);

  const days: { date: string; count: number }[] = [];
  for (let i = 0; i <= 364; i++) {
    const d = new Date(startDay);
    d.setDate(startDay.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const data = heatmap.find((h) => h.date === dateStr);
    days.push({
      date: dateStr,
      count: data ? data.count : 0,
    });
  }

  // Weeks
  const weeks: { date: string; count: number }[][] = [];
  let currentWeek: { date: string; count: number }[] = [];
  for (let i = 0; i < days.length; i++) {
    currentWeek.push(days[i]);
    if (currentWeek.length === 7 || i === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (count === 1) return 'bg-green-300 dark:bg-green-700';
    return 'bg-green-500 dark:bg-green-500';
  };

  const totalActive = heatmap.length;
  const currentStreak = dashboard?.streakDays || 0;
  const longestStreak = Math.max(currentStreak, ...heatmap.map(h => h.count)); // simplistic proxy for longest

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">Study Calendar</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Current Streak</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{currentStreak} Days</div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Total Active Days</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{totalActive} Days</div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium">Total Lessons Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{dashboard?.completedLessonsCount || 0}</div>
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="mb-4">
          <div className="font-semibold text-lg">Activity Heatmap</div>
        </div>
        <div>
          <div className="flex gap-1 overflow-x-auto pb-4">
            {weeks.map((w, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {w.map((d, di) => (
                  <div
                    key={d.date}
                    className={`w-3 h-3 rounded-sm ${getColor(d.count)} transition-all hover:ring-2 hover:ring-blue-400`}
                    title={`${d.date}: ${d.count} lessons`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-700" />
            <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-500" />
            <span>More</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
