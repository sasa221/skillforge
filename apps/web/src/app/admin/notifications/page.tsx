'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, BookOpenText, CheckCircle2, Settings2, Sparkles, Users, Wrench } from 'lucide-react';

import { AdminPageIntro, AdminStatusPill, AdminSurface } from '@/components/admin/AdminUi';
import { notificationsApi } from '@/lib/api/endpoints';
import type { NotificationFeedItem } from '@/lib/content/types';

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'me'],
    queryFn: notificationsApi.list,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] });
    },
  });

  if (notificationsQuery.isLoading) {
    return (
      <main className="space-y-6">
        <div className="h-20 w-80 rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
          <div className="h-[34rem] rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
          <div className="h-[34rem] rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
        </div>
      </main>
    );
  }

  if (notificationsQuery.isError) {
    return (
      <main className="rounded-[1.8rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
        <div className="font-semibold">Could not load admin notifications</div>
        <div className="mt-2">
          {notificationsQuery.error instanceof Error
            ? notificationsQuery.error.message
            : 'Unknown error'}
        </div>
      </main>
    );
  }

  const notifications = notificationsQuery.data?.items ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const todayCount = notifications.filter((item) => getNotificationSection(item.createdAt) === 'today').length;
  const linkedCount = notifications.filter((item) => Boolean(item.href)).length;

  return (
    <main className="space-y-6">
      <AdminPageIntro
        title="Admin Notifications"
        description="Recent account events, learning milestones, and shortcuts back to the work that needs attention."
        actions={
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending || unreadCount === 0}
            className="inline-flex h-14 items-center justify-center rounded-[1.2rem] border border-[var(--site-primary)]/20 bg-[var(--site-primary-soft)] px-5 text-lg font-semibold text-[var(--site-primary)] transition hover:bg-[var(--site-primary-soft)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {markAllRead.isPending ? 'Marking...' : 'Mark all as read'}
          </button>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <MetricCard label="Unread" value={`${unreadCount}`} hint="Notifications still waiting for review" />
        <MetricCard label="Today" value={`${todayCount}`} hint="Items created during the current day" />
        <MetricCard label="Deep links" value={`${linkedCount}`} hint="Notifications that open directly into the product" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
        <AdminSurface>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-4xl font-semibold text-[var(--site-text)]">Recent activity</h2>
              <p className="mt-2 text-lg text-[var(--site-muted)]">
                Real notifications tied to progress, quizzes, and account activity.
              </p>
            </div>
            <AdminStatusPill tone={unreadCount > 0 ? 'orange' : 'emerald'}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </AdminStatusPill>
          </div>

          <div className="mt-8 space-y-4">
            {notifications.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5 text-sm leading-7 text-[var(--site-muted)]">
                Admin notifications will appear here as you complete lessons, pass checkpoints, and manage content.
              </div>
            ) : (
              notifications.map((item) => {
                const unread = !item.readAt;
                const content = (
                  <>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xl font-semibold text-[var(--site-text)]">{item.title}</div>
                          <div className="mt-2 text-sm leading-7 text-[var(--site-muted)]">
                            {item.body ?? 'New account activity is available.'}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-sm text-[var(--site-subtle)]">
                            {formatRelativeTime(item.createdAt)}
                          </div>
                          <div className="mt-3 flex justify-end">
                            <span
                              className={
                                unread
                                  ? 'h-3 w-3 rounded-full bg-[var(--site-primary)]'
                                  : 'h-3 w-3 rounded-full bg-[var(--site-border)]'
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        {item.href ? (
                          <span className="inline-flex items-center rounded-full bg-[var(--site-primary-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--site-primary)]">
                            Open related page
                          </span>
                        ) : null}
                        {unread ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              markRead.mutate(item.id);
                            }}
                            className="inline-flex items-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
                          >
                            Mark as read
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </>
                );

                const className = `flex items-start gap-4 rounded-[1.5rem] border p-5 transition ${
                  unread
                    ? 'border-[var(--site-primary)]/20 bg-[var(--site-surface)] shadow-[0_18px_36px_var(--site-shadow)]'
                    : 'border-[var(--site-border)] bg-[var(--site-surface-alt)]'
                }`;

                if (item.href) {
                  return (
                    <Link key={item.id} href={item.href} className={className}>
                      {content}
                    </Link>
                  );
                }

                return (
                  <div key={item.id} className={className}>
                    {content}
                  </div>
                );
              })
            )}
          </div>
        </AdminSurface>

        <div className="space-y-6">
          <AdminSurface>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-[var(--site-text)]">Quick routes</h2>
                <p className="mt-2 text-base text-[var(--site-muted)]">
                  Jump straight into the areas admin work touches most often.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <QuickLink href="/admin" icon={Sparkles} label="Overview" />
              <QuickLink href="/admin/courses" icon={BookOpenText} label="Manage Courses" />
              <QuickLink href="/admin/users" icon={Users} label="Review Learners" />
              <QuickLink href="/admin/skills" icon={Wrench} label="Manage Skills" />
              <QuickLink href="/admin/settings" icon={Settings2} label="Admin Settings" />
            </div>
          </AdminSurface>

          <AdminSurface>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-success-soft)] text-[var(--site-success)]">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-[var(--site-text)]">Notification health</h2>
                <p className="mt-2 text-base text-[var(--site-muted)]">
                  Keep unread items low so course and learner issues stay visible.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4 text-sm leading-7 text-[var(--site-muted)]">
              {unreadCount > 0
                ? `You have ${unreadCount} unread item${unreadCount === 1 ? '' : 's'} waiting for review.`
                : 'Everything is reviewed for now. New events will appear here as they are recorded.'}
            </div>
          </AdminSurface>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <AdminSurface>
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">{label}</div>
      <div className="mt-4 text-5xl font-semibold text-[var(--site-text)]">{value}</div>
      <div className="mt-3 text-base leading-7 text-[var(--site-muted)]">{hint}</div>
    </AdminSurface>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Bell;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-4 text-base font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
    >
      <Icon className="h-5 w-5 text-[var(--site-primary)]" />
      {label}
    </Link>
  );
}

function getNotificationSection(createdAt: string) {
  const created = new Date(createdAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (created >= today) return 'today';
  if (created >= yesterday) return 'yesterday';
  return 'older';
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
