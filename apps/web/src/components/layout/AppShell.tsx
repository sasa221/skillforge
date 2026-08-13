'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bell, BookOpen, Compass, Gem, Zap } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { notificationsApi, progressApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/lib/auth/store';
import { headingFont } from '@/lib/fonts';
import { cn } from '@/lib/utils';

type AppShellProps = {
  children: React.ReactNode;
};

const baseNavItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/calendar', label: 'Calendar' },
  { href: '/dashboard/skills', label: 'Skill Map' },
  { href: '/dashboard/challenges', label: 'Challenges ⚔️' },
  { href: '/dashboard/code-rooms', label: 'Code Rooms 👥' },
  { href: '/dashboard/courses', label: 'My Courses' },
  { href: '/dashboard/achievements', label: 'Achievements' },
  { href: '/dashboard/leaderboard', label: 'Leaderboard' },
  { href: '/dashboard/certificates', label: 'Certificates' },
  { href: '/dashboard/settings/security', label: 'Security' },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  if (pathname.startsWith('/dashboard/courses') || pathname.startsWith('/dashboard/lessons')) {
    return <LearningShell pathname={pathname}>{children}</LearningShell>;
  }

  return <DefaultDashboardShell pathname={pathname}>{children}</DefaultDashboardShell>;
}

function DefaultDashboardShell({
  pathname,
  children,
}: {
  pathname: string;
  children: React.ReactNode;
}) {
  const user = useAuthStore((state) => state.user);
  const displayName = user?.profile?.fullName ?? user?.email ?? 'Learner';
  const initials = getInitials(displayName);
  const hasInstructorWorkspace =
    user?.roles.some((role) =>
      ['instructor', 'admin', 'content_manager', 'super_admin'].includes(role),
    ) ?? false;
  const navItems = hasInstructorWorkspace
    ? [...baseNavItems, { href: '/instructor', label: 'Instructor' }]
    : baseNavItems;
  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'me'],
    queryFn: notificationsApi.list,
    staleTime: 20_000,
  });
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const verificationHref = user?.email
    ? `/verify-email?email=${encodeURIComponent(user.email)}&next=${encodeURIComponent(pathname)}`
    : '/verify-email';

  return (
    <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors">
      {user && !user.isEmailVerified && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-center text-xs font-semibold text-amber-400 flex items-center justify-center gap-2">
          <span>⚠️ Account email is unverified. Please confirm your 6-digit OTP code to unlock all features.</span>
          <Link
            href={verificationHref}
            className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-3 py-1 font-bold text-amber-300 hover:bg-amber-500/30 transition"
          >
            Verify Now
          </Link>
        </div>
      )}
      <div className="border-b border-[var(--site-border)] bg-[var(--site-surface)] backdrop-blur">
        <header className="container flex h-16 items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span className="h-4 w-4 rotate-45 rounded-[3px] bg-primary shadow-[0_0_18px_rgba(249,115,22,0.45)]" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-[var(--site-text)]">
              SkillForge
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <nav className="hidden items-center gap-2 md:flex">
              {navItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'rounded-xl px-4 py-2 text-sm font-medium text-[var(--site-muted)] transition hover:bg-[var(--site-surface-alt)] hover:text-[var(--site-text)]',
                      active && 'bg-[var(--site-primary-soft)] text-[var(--site-primary)]',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <NotificationBell
              unreadCount={unreadCount}
              notifications={notificationsQuery.data?.items ?? []}
            />

            <Link
              href="/dashboard/profile"
              className={cn(
                'group flex items-center gap-3 rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-2.5 py-1.5 transition hover:border-[var(--site-border-strong)] hover:bg-[var(--site-surface-alt)]',
                (pathname === '/dashboard/profile' || pathname.startsWith('/dashboard/profile/')) &&
                  'bg-[var(--site-primary-soft)]',
              )}
              aria-current={
                pathname === '/dashboard/profile' || pathname.startsWith('/dashboard/profile/')
                  ? 'page'
                  : undefined
              }
            >
              <div className="hidden min-w-[132px] text-right md:block">
                <div className="truncate text-sm font-semibold text-[var(--site-text)]">{displayName}</div>
                <div className="mt-0.5 text-[11px] uppercase tracking-[0.22em] text-[var(--site-subtle)]">
                  Learner
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-primary-soft)] text-sm font-semibold text-[var(--site-primary)] transition group-hover:border-[var(--site-border-strong)]">
                {initials || 'SF'}
              </div>
            </Link>
          </div>
        </header>
      </div>

      {!user?.isEmailVerified ? (
        <div className="container pt-4">
          <div className="rounded-[1.35rem] border border-[var(--site-warm)]/20 bg-[var(--site-warm-soft)] px-5 py-4 text-sm text-[var(--site-warm)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold">Verify your email to secure your account.</div>
                <div className="mt-1 text-[var(--site-muted)]">
                  We already prepared the verification flow for this account. You can finish it in one step.
                </div>
              </div>
              <Link
                href={verificationHref}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--site-warm)]/20 bg-white px-4 py-2 font-semibold text-[var(--site-warm)] transition hover:bg-[var(--site-warm-soft)]"
              >
                Verify email
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <main className="container py-8 md:py-10">{children}</main>
    </div>
  );
}

function LearningShell({
  pathname,
  children,
}: {
  pathname: string;
  children: React.ReactNode;
}) {
  const user = useAuthStore((state) => state.user);
  const dashboardQuery = useQuery({
    queryKey: ['progress', 'dashboard'],
    queryFn: progressApi.dashboard,
    staleTime: 20_000,
  });
  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'me'],
    queryFn: notificationsApi.list,
    staleTime: 20_000,
  });

  const displayName = user?.profile?.fullName ?? user?.email?.split('@')[0] ?? 'Learner';
  const initials = getInitials(displayName);
  const hasInstructorWorkspace =
    user?.roles.some((role) =>
      ['instructor', 'admin', 'content_manager', 'super_admin'].includes(role),
    ) ?? false;
  const xp = dashboardQuery.data?.xp ?? user?.profile?.xp ?? 0;
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const verificationHref = user?.email
    ? `/verify-email?email=${encodeURIComponent(user.email)}&next=${encodeURIComponent(pathname)}`
    : '/verify-email';
  const lessonHref = pathname.startsWith('/dashboard/lessons/')
    ? pathname
    : dashboardQuery.data?.continueLesson
      ? `/dashboard/lessons/${dashboardQuery.data.continueLesson.slug}`
      : '/dashboard/courses';

  const navItems = pathname.startsWith('/dashboard/lessons/')
    ? [
        { href: '/learning-path', label: 'Learning Path' },
        { href: '/dashboard/courses', label: 'My Courses' },
        { href: lessonHref, label: 'Current Lesson' },
        ...(hasInstructorWorkspace ? [{ href: '/instructor', label: 'Instructor' }] : []),
      ]
    : [
        { href: '/dashboard/courses', label: 'My Courses' },
        { href: '/learning-path', label: 'Learning Path' },
        { href: '/certificates', label: 'Certificates' },
        { href: '/community', label: 'Community' },
        ...(hasInstructorWorkspace ? [{ href: '/instructor', label: 'Instructor' }] : []),
      ];

  return (
    <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors">
      <div className="border-b border-[var(--site-border)] bg-[var(--site-surface)] backdrop-blur">
        <header className="mx-auto flex h-[86px] w-full max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-10">
            <Link href="/dashboard" className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--site-primary)] text-white shadow-[0_16px_32px_var(--site-shadow)]">
                <BookOpen className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  'text-[1.9rem] font-extrabold leading-none text-[var(--site-text)]',
                  headingFont.className,
                )}
              >
                SkillForge
              </span>
            </Link>

            <nav className="hidden items-center gap-2 lg:flex">
              {navItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      'rounded-full px-4 py-2.5 text-sm font-semibold text-[var(--site-muted)] transition hover:bg-[var(--site-surface-alt)] hover:text-[var(--site-text)]',
                      active && 'bg-[var(--site-primary-soft)] text-[var(--site-primary)]',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <WorkspaceSwitcher />
            <ThemeToggle />
            <div className="hidden items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-success-soft)] px-5 py-3 text-base font-extrabold text-[var(--site-success)] md:inline-flex">
              <Zap className="h-4 w-4" />
              {xp} XP
            </div>

            <NotificationBell
              unreadCount={unreadCount}
              notifications={notificationsQuery.data?.items ?? []}
            />

            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-2 py-2 pr-4 shadow-[0_12px_24px_var(--site-shadow)] transition hover:border-[var(--site-border-strong)] hover:bg-[var(--site-surface-alt)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-primary-soft)] text-sm font-bold text-[var(--site-primary)]">
                {initials || 'SF'}
              </div>
              <div className="hidden text-left md:block">
                <div className="max-w-[120px] truncate text-sm font-semibold text-[var(--site-text)]">
                  {displayName}
                </div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--site-subtle)]">
                  Active learner
                </div>
              </div>
            </Link>
          </div>
        </header>
      </div>

      {!user?.isEmailVerified ? (
        <div className="mx-auto w-full max-w-[1500px] px-4 pt-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.35rem] border border-[var(--site-warm)]/20 bg-[var(--site-warm-soft)] px-5 py-4 text-sm text-[var(--site-warm)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold">Your email is not verified yet.</div>
                <div className="mt-1 text-[var(--site-muted)]">
                  Finish verification once and we will keep this reminder out of your way.
                </div>
              </div>
              <Link
                href={verificationHref}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--site-warm)]/20 bg-white px-4 py-2 font-semibold text-[var(--site-warm)] transition hover:bg-[var(--site-warm-soft)]"
              >
                Verify email
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

function getInitials(input: string): string {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('');
}
