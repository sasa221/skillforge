'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';

import {
  AdminMetricCard,
  AdminPageIntro,
  AdminStatusPill,
  AdminSurface,
} from '@/components/admin/AdminUi';
import { adminApi } from '@/lib/api/endpoints';
import { cn } from '@/lib/utils';

const pageSize = 10;
const roleFilters = ['all', 'admin', 'content_manager', 'super_admin', 'instructor', 'student'] as const;
const userGridClass =
  'grid grid-cols-[280px_320px_180px_130px_170px_170px] items-center gap-6';

export default function AdminUsersPage() {
  const [page, setPage] = React.useState(1);
  const [selectedRole, setSelectedRole] =
    React.useState<(typeof roleFilters)[number]>('all');

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', page, pageSize, selectedRole],
    queryFn: () => adminApi.users(page, pageSize, selectedRole),
  });

  React.useEffect(() => {
    setPage(1);
  }, [selectedRole]);

  if (usersQuery.isLoading) {
    return (
      <main className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-48 rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]"
            />
          ))}
        </div>
        <div className="h-[42rem] rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
      </main>
    );
  }

  if (usersQuery.isError || !usersQuery.data) {
    return (
      <main className="rounded-[1.8rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
        <div className="font-semibold">Could not load users</div>
        <div className="mt-2 text-[var(--site-danger)]/80">
          {usersQuery.error instanceof Error ? usersQuery.error.message : 'Unknown error'}
        </div>
      </main>
    );
  }

  const totalPages = Math.max(1, Math.ceil(usersQuery.data.total / pageSize));
  const filteredItems = usersQuery.data.items;
  const pageNumbers = buildPageNumbers(page, totalPages);

  return (
    <main className="space-y-6">
      <AdminPageIntro
        title="Users Management"
        description="Track account roles, XP distribution, and learner progression."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <AdminMetricCard
          title="Total Users"
          value={usersQuery.data.stats.totalUsers.toLocaleString()}
          detail={`${usersQuery.data.stats.studentCount.toLocaleString()} learners across the platform`}
          icon={Users}
          tone="orange"
        />
        <AdminMetricCard
          title="Admin Accounts"
          value={usersQuery.data.stats.adminCount.toLocaleString()}
          detail={`${usersQuery.data.stats.studentCount.toLocaleString()} learners in the platform`}
          icon={ShieldCheck}
          tone="blue"
        />
        <AdminMetricCard
          title="New Signups"
          value={usersQuery.data.stats.newSignupCount.toLocaleString()}
          detail="Joined in the last 30 days"
          icon={UserPlus}
          tone="emerald"
        />
      </section>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-3">
          {roleFilters.map((role) => {
            const active = selectedRole === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={cn(
                  'inline-flex h-14 items-center justify-center rounded-[1.15rem] border px-5 text-lg font-semibold transition',
                  active
                    ? 'border-primary/20 bg-primary text-primary-foreground shadow-[0_18px_32px_rgba(249,115,22,0.22)]'
                    : 'border-[var(--site-border)] bg-[var(--site-surface-alt)] text-[var(--site-text)] hover:bg-[var(--site-primary-soft)]',
                )}
              >
                {roleLabel(role)}
              </button>
            );
          })}
        </div>

        <div className="inline-flex h-14 items-center gap-3 rounded-[1.15rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 text-lg text-[var(--site-text)]">
          <CalendarDays className="h-5 w-5 text-primary" />
          {selectedRole === 'all'
            ? 'All user roles'
            : `Filtered: ${roleLabel(selectedRole)}`}
        </div>
      </div>

      <AdminSurface className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[1220px]">
            <div
              className={cn(
                userGridClass,
                'bg-[var(--site-surface-alt)] px-8 py-6 text-[0.92rem] font-semibold uppercase tracking-[0.22em] text-[var(--site-subtle)]',
              )}
            >
              <div>User</div>
              <div>Email</div>
              <div>Role</div>
              <div>XP Points</div>
              <div>Level</div>
              <div>Joined</div>
            </div>

            <div className="divide-y divide-[var(--site-border)]">
              {filteredItems.length === 0 ? (
                <div className="px-8 py-8 text-lg text-[var(--site-muted)]">
                  No users match the selected role.
                </div>
              ) : (
                filteredItems.map((user) => {
                  const displayName = user.profile?.fullName ?? user.email.split('@')[0];
                  const initials = displayName
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? '')
                    .join('');
                  const xp = user.profile?.xp ?? 0;
                  const level = user.profile?.level ?? 1;
                  const levelProgress = Math.max(
                    8,
                    Math.min(100, Math.round(((xp % 400) / 400) * 100)),
                  );

                  return (
                    <div key={user.id} className={cn(userGridClass, 'px-8 py-8')}>
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 text-base font-semibold text-primary">
                          {initials || 'SF'}
                        </div>
                        <div className="min-w-0">
                          <div className="break-words text-[1.55rem] font-semibold leading-[1.12] text-[var(--site-text)]">
                            {displayName}
                          </div>
                          <div className="mt-2 text-sm leading-6 text-[var(--site-subtle)]">
                            UID: {user.id.slice(0, 8)}
                          </div>
                        </div>
                      </div>

                      <div className="min-w-0 break-all text-[1.22rem] leading-7 text-[var(--site-muted)]">
                        {user.email}
                      </div>

                      <div className="min-w-0">
                        <AdminStatusPill tone={roleTone(user.roles)}>
                          {roleLabel(user.roles[0] ?? 'student').toUpperCase()}
                        </AdminStatusPill>
                      </div>

                      <div className="text-[2.35rem] font-semibold leading-none text-[var(--site-text)]">
                        {xp.toLocaleString()}
                      </div>

                      <div className="flex min-w-0 items-center gap-4">
                        <div className="h-3 w-28 shrink-0 rounded-full bg-[var(--site-border)]">
                          <div
                            className="h-3 rounded-full bg-primary"
                            style={{ width: `${levelProgress}%` }}
                          />
                        </div>
                        <div className="text-right">
                          <div className="text-xs uppercase tracking-[0.18em] text-primary">
                            Lv.
                          </div>
                          <div className="text-[1.9rem] font-semibold leading-none text-[var(--site-text)]">
                            {level}
                          </div>
                        </div>
                      </div>

                      <div className="text-[1.18rem] leading-7 text-[var(--site-muted)]">
                        {formatDate(user.createdAt)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-[var(--site-border)] px-8 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-lg text-[var(--site-muted)]">
            Showing {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, usersQuery.data.total)} of{' '}
            {usersQuery.data.total.toLocaleString()} users
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] text-lg text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)] disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                className={cn(
                  'flex h-12 min-w-[3rem] items-center justify-center rounded-[1rem] border px-3 text-lg font-semibold transition',
                  pageNumber === page
                    ? 'border-primary/20 bg-primary text-primary-foreground'
                    : 'border-[var(--site-border)] bg-[var(--site-surface-alt)] text-[var(--site-text)] hover:bg-[var(--site-primary-soft)]',
                )}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
              className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] text-lg text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)] disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </AdminSurface>
    </main>
  );
}

function roleLabel(role: string) {
  if (role === 'all') return 'All Roles';
  if (role === 'content_manager') return 'Content';
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'instructor') return 'Instructor';
  if (role === 'student') return 'Student';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function roleTone(roles: string[]) {
  if (roles.includes('super_admin')) return 'violet' as const;
  if (roles.includes('admin')) return 'orange' as const;
  if (roles.includes('content_manager')) return 'blue' as const;
  if (roles.includes('instructor')) return 'emerald' as const;
  return 'slate' as const;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function buildPageNumbers(current: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages, current, current - 1, current + 1]);
  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
}
