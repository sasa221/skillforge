'use client';
import * as React from 'react';
import { CheckCircle, Zap } from 'lucide-react';

type Props = { xpEarned?: number; onDismiss: () => void };

export function CompletionCelebration({ xpEarned, onDismiss }: Props) {
  React.useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className="pointer-events-auto animate-[bounce_0.5s_ease-out] rounded-3xl border border-[var(--site-success)]/20 bg-gradient-to-br from-[var(--site-success-soft)] to-emerald-50/80 p-8 text-center shadow-2xl backdrop-blur-xl dark:from-emerald-900/40 dark:to-emerald-800/20"
        onClick={onDismiss}
      >
        <div className="mb-4 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-[var(--site-text)]">Lesson Complete! 🎉</h2>
        {xpEarned ? (
          <div className="flex items-center justify-center gap-2 text-amber-500">
            <Zap className="h-5 w-5" />
            <span className="text-lg font-semibold">+{xpEarned} XP earned</span>
          </div>
        ) : null}
        <p className="mt-3 text-sm text-[var(--site-muted)]">Click anywhere to continue</p>
      </div>
    </div>
  );
}
