'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Bell,
  BookOpenText,
  Bot,
  Flame,
  GraduationCap,
  Trophy,
} from 'lucide-react';

import { notificationsApi, progressApi } from '@/lib/api/endpoints';
import type { NotificationFeedItem } from '@/lib/content/types';
import { useAuthStore } from '@/lib/auth/store';
import { cn } from '@/lib/utils';

type NotificationSection = 'today' | 'yesterday' | 'older';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const dashboardQuery = useQuery({
    queryKey: ['progress', 'dashboard'],
    queryFn: progressApi.dashboard,
  });

  const profileQuery = useQuery({
    queryKey: ['progress', 'profile'],
    queryFn: progressApi.profile,
  });

  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'me'],
    queryFn: notificationsApi.list,
  });

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] });
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] });
    },
  });

  const displayName =
    user?.profile?.fullName ?? user?.email?.split('@')[0] ?? 'SkillForge Learner';
  const xp = profileQuery.data?.xp ?? user?.profile?.xp ?? 0;
  const level = profileQuery.data?.level ?? user?.profile?.level ?? 1;
  const stats = profileQuery.data?.stats;
  const streakDays = dashboardQuery.data?.streakDays ?? 0;
  const courses = profileQuery.data?.courses ?? [];
  const continueLesson = dashboardQuery.data?.continueLesson;
  const topCourse =
    [...courses].sort((left, right) => right.percent - left.percent)[0] ?? null;

  const notifications = notificationsQuery.data?.items ?? [];
  const grouped = {
    today: notifications.filter((item) => getNotificationSection(item.createdAt) === 'today'),
    yesterday: notifications.filter((item) => getNotificationSection(item.createdAt) === 'yesterday'),
    older: notifications.filter((item) => getNotificationSection(item.createdAt) === 'older'),
  };

  const totalUnread = notificationsQuery.data?.unreadCount ?? 0;
  const levelBaseXp = Math.max(0, xp - (xp % 400));
  const nextLevelXp = stats?.nextLevelXp ?? levelBaseXp + 400;
  const levelProgressPercent = stats?.levelProgressPercent ?? 0;
  const rank = stats?.globalRank ?? null;

  if (dashboardQuery.isLoading || profileQuery.isLoading || notificationsQuery.isLoading) {
    return (
      <main className="space-y-8 pb-6">
        <div className="h-20 w-72 rounded-2xl bg-white/[0.04]" />
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <div className="h-[36rem] rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
          <div className="h-[36rem] rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
        </div>
      </main>
    );
  }

  if (dashboardQuery.isError || profileQuery.isError || notificationsQuery.isError) {
    return (
      <main className="rounded-[1.75rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
        <div className="font-semibold">Could not load notifications</div>
        <div className="mt-2">
          {dashboardQuery.error instanceof Error
            ? dashboardQuery.error.message
            : profileQuery.error instanceof Error
              ? profileQuery.error.message
              : notificationsQuery.error instanceof Error
                ? notificationsQuery.error.message
                : 'Unknown error'}
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-8 pb-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-[var(--site-text)]">Notifications</h1>
          <p className="mt-3 text-xl text-[var(--site-muted)]">
            Real activity from your account, progress, and course milestones.
          </p>
        </div>
        <button
          type="button"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending || totalUnread === 0}
          className="w-fit rounded-2xl border border-[var(--site-primary)]/20 bg-[var(--site-primary-soft)] px-5 py-3 text-sm font-semibold text-[var(--site-primary)] transition hover:bg-[var(--site-primary-soft)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {markAllRead.isPending ? 'Marking...' : 'Mark all as read'}
        </button>
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="space-y-8">
          <NotificationGroup
            title="Today"
            items={grouped.today}
            onRead={(id) => markRead.mutate(id)}
          />
          <NotificationGroup
            title="Yesterday"
            items={grouped.yesterday}
            onRead={(id) => markRead.mutate(id)}
          />
          <NotificationGroup
            title="Older"
            items={grouped.older}
            onRead={(id) => markRead.mutate(id)}
          />
        </div>

        <aside className="space-y-6">
          <section className="rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_40px_var(--site-shadow)]">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[var(--site-primary)] text-3xl font-semibold text-white shadow-[0_18px_34px_var(--site-shadow)]">
                {level}
              </div>
              <div>
                <div className="text-3xl font-semibold text-[var(--site-text)]">{displayName}</div>
                <div className="mt-1 text-lg text-[var(--site-muted)]">
                  {xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
                </div>
              </div>
            </div>

            <div className="mt-6 h-3 rounded-full bg-[var(--site-border)]">
              <div
                className="h-3 rounded-full bg-[var(--site-primary)]"
                style={{ width: `${levelProgressPercent}%` }}
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <MiniStat label="Total XP" value={`${(xp / 1000).toFixed(1)}k`} />
              <MiniStat label="Rank" value={rank ? `#${rank}` : 'Not ranked yet'} />
            </div>

            <Link
              href="/dashboard/achievements"
              className="mt-6 inline-flex h-14 w-full items-center justify-center rounded-[1.2rem] bg-[var(--site-primary)] text-lg font-semibold text-white shadow-[0_18px_34px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)]"
            >
              View achievements
            </Link>
          </section>

          <section className="rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_40px_var(--site-shadow)]">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--site-subtle)]">
              Learning focus
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.4rem] border border-[var(--site-border)] bg-[linear-gradient(135deg,var(--site-text)_0%,color-mix(in_srgb,var(--site-text)_88%,var(--site-primary)_12%)_52%,color-mix(in_srgb,var(--site-text)_80%,var(--site-primary)_20%)_100%)]">
              <div className="h-40 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_20%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0)),repeating-linear-gradient(160deg,rgba(84,174,255,0.24)_0px,rgba(84,174,255,0.24)_2px,transparent_2px,transparent_12px)]" />
            </div>

            <div className="mt-5">
              <div className="text-3xl font-semibold text-[var(--site-text)]">
                {continueLesson?.courseTitle ?? topCourse?.course.title ?? 'Keep building momentum'}
              </div>
              <p className="mt-3 text-lg text-[var(--site-muted)]">
                {continueLesson
                  ? `Resume "${continueLesson.title}" and keep your learning streak alive.`
                  : topCourse
                    ? `You are ${topCourse.percent}% through this track. Finish the next milestone to unlock more badges.`
                    : 'Start your next course and new milestones will begin showing up here.'}
              </p>
            </div>

            <Link
              href={
                continueLesson
                  ? `/dashboard/lessons/${continueLesson.slug}`
                  : topCourse
                    ? `/dashboard/courses/${topCourse.course.slug}`
                    : '/dashboard/courses'
              }
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] text-base font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
            >
              Resume learning
            </Link>
          </section>

          <section className="rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-4 shadow-[0_18px_40px_var(--site-shadow)]">
            <QuickLink href="/dashboard" label="Dashboard" />
            <QuickLink href="/dashboard/courses" label="My Courses" />
            <QuickLink href="/dashboard/achievements" label="Achievements" />
            <QuickLink href="/dashboard/profile" label="Profile" />
            <QuickLink href="/dashboard/notifications" label="Notifications" active />
          </section>

          <div className="px-2 text-center text-sm text-[var(--site-subtle)]">
            {totalUnread > 0
              ? `${totalUnread} unread learning updates`
              : 'All notifications are marked as read'}
          </div>
        </aside>
      </section>
    </main>
  );
}

function NotificationGroup({
  title,
  items,
  onRead,
}: {
  title: string;
  items: NotificationFeedItem[];
  onRead: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--site-subtle)]">
        {title}
      </div>
      <div className="space-y-4">
        {items.map((item) => {
          const unread = !item.readAt;
          const Icon = iconForNotification(item.type);
          const containerClassName = cn(
            'flex items-start gap-4 rounded-[1.6rem] border p-5 transition',
            unread
              ? 'border-[var(--site-primary)]/30 bg-[var(--site-surface)] shadow-[0_18px_40px_var(--site-shadow)]'
              : 'border-[var(--site-border)] bg-[var(--site-surface-alt)]',
          );

          const inner = (
            <>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
                <Icon className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-3xl font-semibold text-[var(--site-text)]">{item.title}</div>
                    <div className="mt-2 text-lg leading-8 text-[var(--site-muted)]">
                      {item.body ?? 'New activity is available.'}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-base text-[var(--site-subtle)]">
                      {formatRelativeTime(item.createdAt)}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <span
                        className={cn(
                          'h-3.5 w-3.5 rounded-full transition',
                          unread ? 'bg-[var(--site-primary)]' : 'bg-[var(--site-border)]',
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          );

          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => onRead(item.id)}
                className={containerClassName}
              >
                {inner}
              </Link>
            );
          }

          return (
            <div key={item.id} className={containerClassName}>
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">{label}</div>
      <div className="mt-3 text-4xl font-semibold text-[var(--site-primary)]">{value}</div>
    </div>
  );
}

function QuickLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'mb-2 flex items-center rounded-[1.1rem] border px-4 py-4 text-lg font-semibold transition last:mb-0',
        active
          ? 'border-[var(--site-primary)]/30 bg-[var(--site-primary-soft)] text-[var(--site-primary)]'
          : 'border-[var(--site-border)] bg-transparent text-[var(--site-muted)] hover:bg-[var(--site-surface-alt)]',
      )}
    >
      {label}
    </Link>
  );
}

function getNotificationSection(createdAt: string): NotificationSection {
  const created = new Date(createdAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (created >= today) return 'today';
  if (created >= yesterday) return 'yesterday';
  return 'older';
}

function iconForNotification(type: string) {
  switch (type) {
    case 'course_enrolled':
      return BookOpenText;
    case 'lesson_completed':
      return GraduationCap;
    case 'quiz_passed':
      return Trophy;
    case 'course_completed':
      return Award;
    case 'ai':
      return Bot;
    case 'streak':
      return Flame;
    default:
      return Bell;
  }
}

function formatRelativeTime(input: string): string {
  const value = new Date(input);
  const diffMs = Date.now() - value.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.round(diffMinutes / 60)}h ago`;
  return `${Math.round(diffMinutes / 1440)}d ago`;
}
