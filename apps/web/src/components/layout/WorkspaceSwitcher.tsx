'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';

import { useAuthStore } from '@/lib/auth/store';
import {
  getAvailableWorkspaces,
  type WorkspaceKey,
  type WorkspaceOption,
} from '@/lib/auth/workspaces';
import { cn } from '@/lib/utils';

type WorkspaceSwitcherProps = {
  compact?: boolean;
  className?: string;
};

export function WorkspaceSwitcher({
  compact = false,
  className,
}: WorkspaceSwitcherProps) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const workspaces = getAvailableWorkspaces(user);

  if (workspaces.length <= 1) return null;

  const currentWorkspace = inferWorkspaceKey(pathname);

  if (compact) {
    const currentLabel =
      workspaces.find((workspace) => workspace.key === currentWorkspace)?.label ?? 'Workspace';

    return (
      <Link
        href="/workspace"
        className={cn(
          'inline-flex h-11 items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 text-sm font-semibold text-[var(--site-text)] shadow-[0_12px_24px_var(--site-shadow)] transition hover:bg-[var(--site-surface-alt)]',
          className,
        )}
      >
        <Sparkles className="h-4 w-4 text-[var(--site-primary)]" />
        <span className="hidden sm:inline">{currentLabel}</span>
        <span className="sm:hidden">Workspace</span>
        <ChevronRight className="h-4 w-4 text-[var(--site-subtle)]" />
      </Link>
    );
  }

  return (
    <div
      className={cn(
        'hidden items-center gap-1 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] p-1 shadow-[0_12px_24px_var(--site-shadow)] lg:flex',
        className,
      )}
    >
      {workspaces.map((workspace) => {
        const active = workspace.key === currentWorkspace;
        const Icon = getWorkspaceIcon(workspace.key);

        return (
          <Link
            key={workspace.key}
            href={workspace.href}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition',
              active
                ? 'bg-[var(--site-primary-soft)] text-[var(--site-primary)]'
                : 'text-[var(--site-muted)] hover:bg-[var(--site-surface-alt)] hover:text-[var(--site-text)]',
            )}
            aria-current={active ? 'page' : undefined}
            title={workspace.description}
          >
            <Icon className="h-4 w-4" />
            {workspace.label}
          </Link>
        );
      })}
    </div>
  );
}

function inferWorkspaceKey(pathname: string): WorkspaceKey | null {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin';
  if (pathname === '/instructor' || pathname.startsWith('/instructor/')) return 'instructor';
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return 'learner';
  return null;
}

function getWorkspaceIcon(key: WorkspaceKey) {
  switch (key) {
    case 'admin':
      return ShieldCheck;
    case 'instructor':
      return Sparkles;
    case 'learner':
    default:
      return BookOpen;
  }
}

export function getWorkspaceCardAccent(key: WorkspaceOption['key']) {
  switch (key) {
    case 'admin':
      return {
        border: 'border-[var(--site-danger)]/20',
        badge: 'bg-[var(--site-danger-soft)] text-[var(--site-danger)]',
      };
    case 'instructor':
      return {
        border: 'border-[var(--site-warm)]/20',
        badge: 'bg-[var(--site-warm-soft)] text-[var(--site-warm)]',
      };
    case 'learner':
    default:
      return {
        border: 'border-[var(--site-primary)]/20',
        badge: 'bg-[var(--site-primary-soft)] text-[var(--site-primary)]',
      };
  }
}

export function getWorkspaceCardIcon(key: WorkspaceOption['key']) {
  return getWorkspaceIcon(key);
}
