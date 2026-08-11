'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  BookOpenText,
  ClipboardCheck,
  Image,
  LayoutGrid,
  LogOut,
  Search,
  Settings2,
  Sparkles,
  Users,
  Wrench,
  BarChart,
} from 'lucide-react';

import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher';
import { authApi } from '@/lib/api/client';
import { notificationsApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/lib/auth/store';
import { cn } from '@/lib/utils';

type AdminShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutGrid },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart },
  { href: '/admin/reviews', label: 'Reviews', icon: ClipboardCheck },
  { href: '/admin/skills', label: 'Manage Skills', icon: Wrench },
  { href: '/admin/instructors', label: 'Instructors', icon: Users },
  { href: '/admin/media-assets', label: 'Media Assets', icon: Image },
  { href: '/admin/courses', label: 'Manage Courses', icon: BookOpenText },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings2 },
];

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const displayName = user?.profile?.fullName ?? user?.email?.split('@')[0] ?? 'Admin';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  const roleLabel = getRoleLabel(user?.roles ?? []);
  const searchPlaceholder = getSearchPlaceholder(pathname);
  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'me'],
    queryFn: notificationsApi.list,
    staleTime: 15_000,
    retry: false,
  });
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // ignore and clear local state either way
    } finally {
      clearSession();
      router.replace('/login');
    }
  };

  return (
    <div className="admin-theme min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="border-b border-[var(--site-border)] bg-[var(--site-surface)] md:sticky md:top-0 md:flex md:h-screen md:w-[290px] md:flex-col md:border-b-0 md:border-r">
          <div className="px-5 pb-5 pt-6 md:px-6 md:pt-7">
            <Link href="/admin" className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.1rem] bg-[var(--site-primary)] text-white shadow-[0_18px_32px_rgba(47,155,255,0.24)]">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <div className="text-3xl font-semibold tracking-tight text-[var(--site-text)]">SkillForge</div>
                <div className="mt-1 text-sm uppercase tracking-[0.24em] text-[var(--site-primary)]">
                  Admin Console
                </div>
              </div>
            </Link>
          </div>

          <nav className="overflow-x-auto px-3 pb-5 md:flex-1 md:overflow-visible md:px-2">
            <div className="flex gap-2 md:flex-col">
              {navItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex min-w-max items-center gap-4 rounded-[1.2rem] border border-transparent px-4 py-4 text-lg text-[var(--site-muted)] transition hover:border-[var(--site-border)] hover:bg-[var(--site-primary-soft)] hover:text-[var(--site-text)] md:min-w-0',
                      active &&
                        'border-[var(--site-border)] bg-[var(--site-primary-soft)] text-[var(--site-text)] shadow-[inset_3px_0_0_0_var(--site-primary),0_14px_28px_var(--site-shadow)]',
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-6 w-6 transition',
                        active ? 'text-[var(--site-primary)]' : 'text-[var(--site-subtle)] group-hover:text-[var(--site-primary)]',
                      )}
                    />
                    <span className={cn('font-medium', active && 'text-[var(--site-primary)]')}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="hidden px-5 pb-5 md:block">
            <div className="rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 shadow-[0_20px_36px_var(--site-shadow)]">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-primary)]">
                System Status
              </div>
              <div className="mt-3 flex items-center gap-3 text-[var(--site-muted)]">
                <span className="h-3 w-3 rounded-full bg-[var(--site-success)]" />
                <span>All systems operational</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-4 flex h-14 w-full items-center justify-center gap-3 rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] text-lg font-medium text-[var(--site-muted)] transition hover:bg-[var(--site-primary-soft)] hover:text-[var(--site-text)] disabled:opacity-60"
            >
              <LogOut className="h-5 w-5" />
              {loggingOut ? 'Signing out...' : 'Logout'}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[var(--site-border)] bg-[var(--site-surface)] backdrop-blur">
            <div className="flex h-20 items-center gap-3 px-5 md:px-8 lg:px-10">
              <div className="md:hidden">
                <Link href="/admin" className="text-xl font-semibold tracking-tight text-[var(--site-text)]">
                  SkillForge Admin
                </Link>
              </div>

              <div className="hidden flex-1 md:flex">
                <div className="flex h-14 w-full max-w-[680px] items-center gap-3 rounded-[1.15rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-[var(--site-subtle)] shadow-[0_12px_24px_var(--site-shadow)]">
                  <Search className="h-5 w-5 text-[var(--site-subtle)]" />
                  <span className="truncate text-lg">{searchPlaceholder}</span>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <ThemeToggle />
                <Link
                  href="/admin/notifications"
                  className={cn(
                    'relative flex h-14 w-14 items-center justify-center rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-muted)] transition hover:bg-[var(--site-primary-soft)] hover:text-[var(--site-text)]',
                    (pathname === '/admin/notifications' || pathname.startsWith('/admin/notifications/')) &&
                      'border-[var(--site-border-strong)] bg-[var(--site-primary-soft)] text-[var(--site-primary)]',
                  )}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 ? (
                    <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-[var(--site-primary)]" />
                  ) : null}
                </Link>
                <Link
                  href="/admin/settings"
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-muted)] transition hover:bg-[var(--site-primary-soft)] hover:text-[var(--site-text)]',
                    (pathname === '/admin/settings' || pathname.startsWith('/admin/settings/')) &&
                      'border-[var(--site-border-strong)] bg-[var(--site-primary-soft)] text-[var(--site-primary)]',
                  )}
                >
                  <Settings2 className="h-5 w-5" />
                </Link>
                <Link
                  href="/admin/settings"
                  className={cn(
                    'hidden items-center gap-4 rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-2 shadow-[0_14px_28px_var(--site-shadow)] md:flex',
                    (pathname === '/admin/settings' || pathname.startsWith('/admin/settings/')) &&
                      'border-[var(--site-border-strong)] bg-[var(--site-primary-soft)]',
                  )}
                >
                  <div className="text-right">
                    <div className="text-lg font-semibold text-[var(--site-text)]">{displayName}</div>
                    <div className="text-sm font-medium text-[var(--site-primary)]">{roleLabel}</div>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--site-border-strong)] bg-[var(--site-primary-soft)] text-sm font-semibold text-[var(--site-primary)]">
                    {initials || 'SF'}
                  </div>
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-6 md:px-8 md:py-8 lg:px-10">{children}</main>
        </div>
      </div>
    </div>
  );
}

function getRoleLabel(roles: string[]) {
  if (roles.includes('super_admin')) return 'Super Admin';
  if (roles.includes('content_manager')) return 'Content Manager';
  if (roles.includes('admin')) return 'Admin';
  return 'Admin';
}

function getSearchPlaceholder(pathname: string) {
  if (pathname.startsWith('/admin/skills')) {
    return 'Search skills, categories or logs...';
  }

  if (pathname.startsWith('/admin/courses')) {
    return 'Search courses, modules or lessons...';
  }

  if (pathname.startsWith('/admin/reviews')) {
    return 'Search review items, instructors or course titles...';
  }

  if (pathname.startsWith('/admin/users')) {
    return 'Search by name, email, or ID...';
  }

  if (pathname.startsWith('/admin/instructors')) {
    return 'Search instructors, bios or roles...';
  }

  if (pathname.startsWith('/admin/media-assets')) {
    return 'Search media titles, URLs or asset types...';
  }

  return 'Search analytics, users or logs...';
}
