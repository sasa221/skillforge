'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bell, LifeBuoy, MoonStar, ShieldCheck, UserRound } from 'lucide-react';

import { AdminPageIntro, AdminStatusPill, AdminSurface } from '@/components/admin/AdminUi';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { authApi } from '@/lib/api/client';
import { profilesApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/lib/auth/store';

export default function AdminSettingsPage() {
  const sessionUser = useAuthStore((state) => state.user);
  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    initialData: sessionUser ?? undefined,
  });
  const profileQuery = useQuery({
    queryKey: ['profiles', 'me'],
    queryFn: profilesApi.me,
  });

  if (meQuery.isLoading || profileQuery.isLoading) {
    return (
      <main className="space-y-6">
        <div className="h-20 w-80 rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
          <div className="h-[32rem] rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
          <div className="h-[32rem] rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
        </div>
      </main>
    );
  }

  if (meQuery.isError || profileQuery.isError) {
    return (
      <main className="rounded-[1.8rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
        <div className="font-semibold">Could not load admin settings</div>
        <div className="mt-2">
          {meQuery.error instanceof Error
            ? meQuery.error.message
            : profileQuery.error instanceof Error
              ? profileQuery.error.message
              : 'Unknown error'}
        </div>
      </main>
    );
  }

  const user = meQuery.data!;
  const profile = profileQuery.data;
  const roles = user.roles.map(toRoleLabel);

  return (
    <main className="space-y-6">
      <AdminPageIntro
        title="Admin Settings"
        description="Account details, role access, theme controls, and the shortcuts you are most likely to open next."
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
        <div className="space-y-6">
          <AdminSurface>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
                <UserRound className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-[var(--site-text)]">Account summary</h2>
                <p className="mt-2 text-base text-[var(--site-muted)]">
                  Your current admin account details and learning profile in one place.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <InfoCard label="Full name" value={profile?.fullName ?? 'Not set yet'} />
              <InfoCard label="Email" value={user.email} mono />
              <InfoCard label="Current level" value={`${profile?.level ?? 1}`} />
              <InfoCard label="Current XP" value={`${profile?.xp ?? 0}`} />
            </div>

            <div className="mt-6 rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">Bio</div>
              <div className="mt-3 text-base leading-7 text-[var(--site-muted)]">
                {profile?.bio?.trim() || 'No bio has been added yet.'}
              </div>
            </div>
          </AdminSurface>

          <AdminSurface>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-success-soft)] text-[var(--site-success)]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-[var(--site-text)]">Access levels</h2>
                <p className="mt-2 text-base text-[var(--site-muted)]">
                  Your current roles define which admin areas and content actions are available.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {roles.map((role) => (
                <AdminStatusPill key={role} tone="blue">
                  {role}
                </AdminStatusPill>
              ))}
            </div>

            <div className="mt-6 rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4 text-sm leading-7 text-[var(--site-muted)]">
              Keep your admin shortcuts close here, then jump back into the learner area whenever you want to review the member experience.
            </div>
          </AdminSurface>
        </div>

        <div className="space-y-6">
          <AdminSurface>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
                <MoonStar className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-[var(--site-text)]">Theme</h2>
                <p className="mt-2 text-base text-[var(--site-muted)]">
                  Switch between light and dark mode for the admin area.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <ThemeToggle />
            </div>
          </AdminSurface>

          <AdminSurface>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-[var(--site-text)]">Quick links</h2>
                <p className="mt-2 text-base text-[var(--site-muted)]">
                  Jump to the admin areas you are most likely to open while reviewing content and activity.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <QuickLink href="/admin/notifications" label="Admin notifications" />
              <QuickLink href="/admin/courses" label="Manage courses" />
              <QuickLink href="/admin/users" label="Review learners" />
              <QuickLink href="/support" label="Support center" />
            </div>
          </AdminSurface>

          <AdminSurface>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-warm-soft)] text-[var(--site-warm)]">
                <LifeBuoy className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-[var(--site-text)]">Admin notes</h2>
                <p className="mt-2 text-base text-[var(--site-muted)]">
                  A few practical reminders while we keep tightening the product.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4 text-sm leading-7 text-[var(--site-muted)]">
              Notifications, learner activity, and course management now stay inside the admin shell, so the most common admin routes are all grouped in one place.
            </div>
          </AdminSurface>
        </div>
      </section>
    </main>
  );
}

function InfoCard({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">{label}</div>
      <div className={`mt-3 text-xl font-semibold text-[var(--site-text)] ${mono ? 'break-all font-mono text-base' : ''}`}>
        {value}
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-4 text-base font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
    >
      {label}
    </Link>
  );
}

function toRoleLabel(role: string) {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'content_manager') return 'Content Manager';
  if (role === 'admin') return 'Admin';
  return role.replace(/_/g, ' ');
}
