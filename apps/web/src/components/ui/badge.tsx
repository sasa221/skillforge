'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeProps = {
  children: React.ReactNode;
  variant?: 'cyan' | 'purple' | 'amber' | 'emerald' | 'outline' | 'subtle';
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
};

export function GlowingBadge({ children, variant = 'cyan', className = '', icon: Icon }: BadgeProps) {
  const variantStyles = {
    cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]',
    purple: 'border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    outline: 'border-[var(--site-border)] bg-[var(--site-surface-alt)] text-[var(--site-muted)]',
    subtle: 'border-transparent bg-[var(--site-surface-alt)] text-[var(--site-subtle)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-wider transition-all',
        variantStyles[variant],
        className,
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  );
}
