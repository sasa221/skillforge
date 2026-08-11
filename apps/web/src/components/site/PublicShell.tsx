'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Bell, BookOpen, Compass, Gem, MessageSquareMore, Users } from 'lucide-react';

import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { Global3DWorld } from '@/components/3d/Global3DWorld';
import { notificationsApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/lib/auth/store';
import { headingFont } from '@/lib/fonts';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/instructors', label: 'Instructors', icon: Users },
  { href: '/learning-path', label: 'Learning Path', icon: Compass },
  { href: '/methodology', label: 'Methodology', icon: Compass },
  { href: '/pricing', label: 'Pricing', icon: Gem },
  { href: '/community', label: 'Community', icon: MessageSquareMore },
];

type PublicShellProps = {
  children: React.ReactNode;
};

export function PublicShell({ children }: PublicShellProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'me'],
    queryFn: notificationsApi.list,
    staleTime: 20_000,
    enabled: Boolean(user),
  });

  const displayName = user?.profile?.fullName ?? user?.email?.split('@')[0] ?? 'SkillForge';
  const hasInstructorWorkspace =
    user?.roles.some((role) =>
      ['instructor', 'admin', 'content_manager', 'super_admin'].includes(role),
    ) ?? false;
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  return (
    <div className="relative min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors">
      <Global3DWorld />
      <div className="border-b border-[var(--site-border)] bg-[var(--site-surface)] backdrop-blur-xl">
        <header className="mx-auto flex h-[78px] w-full max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--site-primary)] text-white shadow-[0_16px_32px_var(--site-shadow)]">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className={cn('text-[1.15rem] font-extrabold text-[var(--site-text)]', headingFont.className)}>
                SkillForge
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--site-subtle)]">
                Guided AI learning
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
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

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {user ? (
              <>
                <NotificationBell
                  unreadCount={unreadCount}
                  notifications={notificationsQuery.data?.items ?? []}
                />
                <Link
                  href="/dashboard"
                  className="rounded-full bg-[var(--site-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--site-primary-strong)]"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-[var(--site-muted)] transition hover:bg-[var(--site-surface-alt)] hover:text-[var(--site-text)] sm:inline-flex"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_32px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)]"
                >
                  Sign Up
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </header>
      </div>

      {children}

      <footer className="border-t border-[var(--site-border)] bg-[var(--site-surface)]">
        <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.3fr_repeat(3,0.8fr)] lg:px-8">
          <div className="max-w-xs space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--site-primary)] text-white">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className={cn('text-lg font-extrabold text-[var(--site-text)]', headingFont.className)}>
                SkillForge
              </span>
            </Link>
            <p className="text-sm leading-7 text-[var(--site-muted)]">
              Practical AI learning journeys with guided courses, clear milestones, and support that
              helps learners stay moving.
            </p>
          </div>

          <FooterColumn
            title="Platform"
            links={[
              { href: '/courses', label: 'Courses' },
              { href: '/instructors', label: 'Instructors' },
              { href: '/learning-path', label: 'Learning Paths' },
              { href: '/certificates', label: 'Certificates' },
              { href: '/methodology', label: 'Methodology' },
            ]}
          />
          <FooterColumn
            title="Company"
            links={[
              { href: '/community', label: 'Community' },
              { href: '/pricing', label: 'Pricing' },
              { href: '/signup', label: 'Get Started' },
            ]}
          />
          <FooterColumn
            title="Legal"
            links={[
              { href: '/privacy-policy', label: 'Privacy Policy' },
              { href: '/terms-of-service', label: 'Terms of Service' },
              { href: '/support', label: 'Support Center' },
            ]}
          />
        </div>
        <div className="border-t border-[var(--site-border)]">
          <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-2 px-4 py-5 text-sm text-[var(--site-subtle)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <span>&copy; 2026 SkillForge. Built for focused learning and steady progress.</span>
            <span>EN</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <div className="text-sm font-extrabold uppercase tracking-[0.2em] text-[var(--site-subtle)]">{title}</div>
      <div className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-sm font-medium text-[var(--site-muted)] transition hover:text-[var(--site-primary)]"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
