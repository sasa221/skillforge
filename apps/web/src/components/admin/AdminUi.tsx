'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export function AdminPageIntro({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-5xl font-semibold tracking-tight text-[var(--site-text)]">{title}</h1>
        <p className="mt-3 text-2xl text-[var(--site-muted)]">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export const AdminSurface = React.forwardRef<
  HTMLElement,
  {
    className?: string;
    children: React.ReactNode;
  }
>(function AdminSurface({ className, children }, ref) {
  return (
    <section
      ref={ref}
      className={cn(
        'rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_24px_60px_var(--site-shadow)] transition-colors',
        className,
      )}
    >
      {children}
    </section>
  );
});

export function AdminMetricCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = 'orange',
}: {
  title: string;
  value: string;
  detail: string;
  icon: IconType;
  tone?: 'orange' | 'blue' | 'emerald' | 'violet';
}) {
  return (
    <AdminSurface className="relative overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-[var(--site-surface-alt)]">
          <Icon className={cn('h-8 w-8', toneClasses[tone].icon)} />
        </div>
        <div className={cn('text-lg font-semibold', toneClasses[tone].detail)}>{detail}</div>
      </div>
      <div className="mt-8 text-xl text-[var(--site-muted)]">{title}</div>
      <div className="mt-3 text-6xl font-semibold tracking-tight text-[var(--site-text)]">{value}</div>
      <div className="mt-8 h-2 rounded-full bg-[var(--site-border)]">
        <div className={cn('h-2 rounded-full', toneClasses[tone].bar)} style={{ width: '74%' }} />
      </div>
    </AdminSurface>
  );
}

export function AdminStatusPill({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: 'orange' | 'emerald' | 'violet' | 'blue' | 'slate';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold tracking-[0.12em]',
        statusClasses[tone],
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {children}
    </span>
  );
}

const toneClasses = {
  orange: {
    icon: 'text-[var(--site-primary)]',
    detail: 'text-[var(--site-primary)]',
    bar: 'bg-[linear-gradient(90deg,#f97316_0%,#ff9b49_100%)]',
  },
  blue: {
    icon: 'text-sky-500',
    detail: 'text-sky-500',
    bar: 'bg-[linear-gradient(90deg,#3b82f6_0%,#60a5fa_100%)]',
  },
  emerald: {
    icon: 'text-emerald-500',
    detail: 'text-emerald-500',
    bar: 'bg-[linear-gradient(90deg,#10b981_0%,#34d399_100%)]',
  },
  violet: {
    icon: 'text-violet-500',
    detail: 'text-violet-500',
    bar: 'bg-[linear-gradient(90deg,#8b5cf6_0%,#a78bfa_100%)]',
  },
};

const statusClasses = {
  orange: 'border-[var(--site-primary)]/20 bg-[var(--site-primary-soft)] text-[var(--site-primary)]',
  emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
  violet: 'border-violet-500/20 bg-violet-500/10 text-violet-600',
  blue: 'border-sky-500/20 bg-sky-500/10 text-sky-600',
  slate: 'border-[var(--site-border)] bg-[var(--site-surface-alt)] text-[var(--site-muted)]',
};
