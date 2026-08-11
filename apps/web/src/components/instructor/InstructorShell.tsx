'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Compass, LayoutDashboard, ShieldCheck } from 'lucide-react';

import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher';
import { useAuthStore } from '@/lib/auth/store';
import { headingFont } from '@/lib/fonts';
import { cn } from '@/lib/utils';

const adminRoles = new Set(['admin', 'content_manager', 'super_admin']);

export function InstructorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  const instructorProfile = user?.instructorProfile ?? null;
  const displayName =
    instructorProfile?.fullName ??
    user?.profile?.fullName ??
    user?.email?.split('@')[0] ??
    'Instructor';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  const canOpenAdmin = user?.roles?.some((role) => adminRoles.has(role)) ?? false;

  const navItems = [
    { href: '/instructor', label: 'Workspace' },
    { href: '/instructor/analytics', label: 'Analytics' },
    { href: '/instructor/students', label: 'Students' },
    ...(instructorProfile?.slug
      ? [{ href: `/instructors/${instructorProfile.slug}`, label: 'Public Profile' }]
      : []),
    { href: '/dashboard', label: 'Learner Dashboard' },
    { href: '/courses', label: 'Course Catalog' },
    ...(canOpenAdmin ? [{ href: '/admin', label: 'Admin Console' }] : []),
  ];

  return (
    <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors">
      <div className="border-b border-[var(--site-border)] bg-[var(--site-surface)] backdrop-blur">
        <header className="mx-auto flex h-[82px] w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/instructor" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--site-primary)] text-white shadow-[0_16px_32px_var(--site-shadow)]">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <div
                  className={cn(
                    'text-[1.15rem] font-extrabold text-[var(--site-text)]',
                    headingFont.className,
                  )}
                >
                  SkillForge
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--site-subtle)]">
                  Instructor workspace
                </div>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 lg:flex">
              {navItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/instructor' && pathname.startsWith(`${item.href}/`));

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
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/dashboard/profile"
              className="group flex items-center gap-3 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-2 py-2 pr-4 shadow-[0_12px_26px_var(--site-shadow)] transition hover:border-[var(--site-border-strong)] hover:bg-[var(--site-surface-alt)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-primary-soft)] text-sm font-semibold text-[var(--site-primary)]">
                {initials || 'SF'}
              </div>
              <div className="hidden text-left sm:block">
                <div className="max-w-[140px] truncate text-sm font-semibold text-[var(--site-text)]">
                  {displayName}
                </div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--site-subtle)]">
                  Instructor
                </div>
              </div>
            </Link>
          </div>
        </header>
      </div>

      <main className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">{children}</main>

      <footer className="border-t border-[var(--site-border)] bg-[var(--site-surface)]">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-3 px-4 py-5 text-sm text-[var(--site-subtle)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4" />
            Instructor tools stay focused on assigned courses, revisions, and review-ready content.
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 font-medium text-[var(--site-primary)] transition hover:text-[var(--site-primary-strong)]"
          >
            <LayoutDashboard className="h-4 w-4" />
            Open learner dashboard
          </Link>
        </div>
      </footer>
    </div>
  );
}
