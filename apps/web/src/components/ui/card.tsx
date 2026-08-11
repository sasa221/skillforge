'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function GlassCard({
  children,
  className = '',
  glowing = false,
  glowColor = 'cyan',
}: {
  children: React.ReactNode;
  className?: string;
  glowing?: boolean;
  glowColor?: 'cyan' | 'purple' | 'amber' | 'emerald';
}) {
  const glowStyles = {
    cyan: 'shadow-[0_20px_50px_rgba(56,189,248,0.12)] border-cyan-500/30',
    purple: 'shadow-[0_20px_50px_rgba(129,140,248,0.12)] border-indigo-500/30',
    amber: 'shadow-[0_20px_50px_rgba(245,158,11,0.12)] border-amber-500/30',
    emerald: 'shadow-[0_20px_50px_rgba(52,211,153,0.12)] border-emerald-500/30',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 backdrop-blur-xl transition-all duration-300 hover:border-[var(--site-border-strong)] hover:shadow-2xl',
        glowing && glowStyles[glowColor],
        className,
      )}
    >
      {children}
    </div>
  );
}
