'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function GradientProgressBar({
  percent = 0,
  className = '',
  color = 'cyan',
}: {
  percent: number;
  className?: string;
  color?: 'cyan' | 'purple' | 'amber' | 'emerald';
}) {
  const gradientStyles = {
    cyan: 'from-cyan-500 to-blue-600 shadow-[0_0_12px_rgba(56,189,248,0.5)]',
    purple: 'from-indigo-500 to-purple-600 shadow-[0_0_12px_rgba(168,85,247,0.5)]',
    amber: 'from-amber-400 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]',
    emerald: 'from-emerald-400 to-teal-600 shadow-[0_0_12px_rgba(16,185,129,0.5)]',
  };

  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--site-surface-alt)]', className)}>
      <div
        className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out', gradientStyles[color])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
