'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export const adminInputClassName =
  'h-14 w-full rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-base text-[var(--site-text)] outline-none transition placeholder:text-[var(--site-subtle)] focus:border-[var(--site-primary)]/35';

export const adminTextareaClassName =
  'min-h-[150px] w-full rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-4 text-base text-[var(--site-text)] outline-none transition placeholder:text-[var(--site-subtle)] focus:border-[var(--site-primary)]/35';

export const adminSelectClassName = cn(adminInputClassName, 'appearance-none');

export function AdminField({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn('block space-y-3', className)}>
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
        {label}
      </div>
      {children}
      {hint ? <div className="text-sm text-[var(--site-subtle)]">{hint}</div> : null}
    </label>
  );
}
