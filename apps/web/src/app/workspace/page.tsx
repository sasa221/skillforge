'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

import { ThemeToggle } from '@/components/theme/ThemeToggle';
import {
  WorkspaceSwitcher,
  getWorkspaceCardAccent,
  getWorkspaceCardIcon,
} from '@/components/layout/WorkspaceSwitcher';
import { useAuthInit } from '@/lib/auth/use-auth-init';
import { useAuthStore } from '@/lib/auth/store';
import { getAvailableWorkspaces } from '@/lib/auth/workspaces';
import { headingFont } from '@/lib/fonts';
import { cn } from '@/lib/utils';

export default function WorkspacePage() {
  const router = useRouter();
  const { accessToken, initTried } = useAuthInit();
  const user = useAuthStore((state) => state.user);

  const workspaces = React.useMemo(() => getAvailableWorkspaces(user), [user]);

  React.useEffect(() => {
    if (!initTried) return;

    if (!accessToken || !user) {
      router.replace('/login?next=%2Fworkspace');
      return;
    }

    if (workspaces.length === 1) {
      router.replace(workspaces[0].href);
    }
  }, [accessToken, initTried, router, user, workspaces]);

  if (!initTried && !accessToken) {
    return (
      <main className="min-h-screen bg-[var(--site-bg)] px-4 py-10 text-[var(--site-text)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <LoadingCard label="Loading workspace access..." />
        </div>
      </main>
    );
  }

  if (!accessToken || !user) return null;
  if (workspaces.length <= 1) return null;

  const displayName = user.profile?.fullName ?? user.email?.split('@')[0] ?? 'SkillForge user';
  const roleList = user.roles.length
    ? user.roles.map((role) => role.replace(/_/g, ' ')).join(' • ')
    : 'student';

  return (
    <main className="min-h-screen bg-[var(--site-bg)] px-4 py-8 text-[var(--site-text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px] space-y-8">
        <section className="flex flex-col gap-4 rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-6 py-6 shadow-[0_24px_60px_var(--site-shadow)] sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--site-primary)]">
                <CheckCircle2 className="h-4 w-4" />
                Multi-workspace access
              </div>
              <h1
                className={cn(
                  'mt-5 text-5xl font-extrabold tracking-tight text-[var(--site-text)]',
                  headingFont.className,
                )}
              >
                Choose where you want to work today
              </h1>
              <p className="mt-4 text-lg leading-8 text-[var(--site-muted)]">
                Welcome back, {displayName}. This account can open more than one workspace, so we
                made the switch explicit instead of guessing where you wanted to land.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--site-subtle)]">
            <span className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-3 py-1.5 font-medium">
              Roles
            </span>
            <span>{roleList}</span>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {workspaces.map((workspace) => {
            const Icon = getWorkspaceCardIcon(workspace.key);
            const accent = getWorkspaceCardAccent(workspace.key);

            return (
              <article
                key={workspace.key}
                className={cn(
                  'rounded-[1.8rem] border bg-[var(--site-surface)] p-6 shadow-[0_24px_60px_var(--site-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--site-border-strong)]',
                  accent.border,
                )}
              >
                <div
                  className={cn(
                    'inline-flex h-12 w-12 items-center justify-center rounded-[1rem] text-sm font-semibold',
                    accent.badge,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-[var(--site-text)]">
                  {workspace.label}
                </h2>
                <p className="mt-3 text-base leading-7 text-[var(--site-muted)]">
                  {workspace.description}
                </p>
                <Link
                  href={workspace.href}
                  className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_18px_34px_var(--site-shadow)] transition hover:bg-primary/90"
                >
                  Open {workspace.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </section>

        <section className="rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-6 py-6 shadow-[0_24px_60px_var(--site-shadow)] sm:px-8">
          <h2 className="text-2xl font-semibold text-[var(--site-text)]">How this works</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <InfoPill
              title="Learner"
              body="Courses, lessons, quizzes, achievements, and the AI tutor for your day-to-day progress."
            />
            <InfoPill
              title="Instructor"
              body="Assigned courses, content updates, revisions, and media tied to your teaching profile."
            />
            <InfoPill
              title="Admin"
              body="Publishing review, users, instructors, media governance, and platform-level controls."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function LoadingCard({ label }: { label: string }) {
  return (
    <div className="rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_24px_60px_var(--site-shadow)]">
      <div className="text-sm text-[var(--site-muted)]">{label}</div>
    </div>
  );
}

function InfoPill({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
        {title}
      </div>
      <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">{body}</p>
    </div>
  );
}
