import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Bot } from 'lucide-react';

import { headingFont } from '@/lib/fonts';
import { cn } from '@/lib/utils';

type AuthScaffoldProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  brandMode?: 'above' | 'inside';
  contentClassName?: string;
};

export function AuthScaffold({
  title,
  subtitle,
  children,
  footer,
  brandMode = 'above',
  contentClassName,
}: AuthScaffoldProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--site-bg)] text-[var(--site-text)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--site-primary-soft),transparent_30%),radial-gradient(circle_at_bottom_right,var(--site-primary-soft),transparent_26%),linear-gradient(180deg,var(--site-bg)_0%,var(--site-bg-soft)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(120,151,183,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(120,151,183,0.12)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-50" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1320px] flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-primary)] text-white shadow-[0_16px_32px_var(--site-shadow)]">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className={cn('text-[2rem] font-extrabold leading-none text-[var(--site-text)]', headingFont.className)}>
                SkillForge
              </div>
              <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--site-subtle)]">
                Guided AI learning
              </div>
            </div>
          </Link>

          <div className="hidden sm:block">
            <Link
              href={brandMode === 'inside' ? '/login' : '/signup'}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border-strong)] bg-[var(--site-surface)] px-5 py-3 text-sm font-semibold text-[var(--site-primary)] shadow-[0_12px_24px_var(--site-shadow)] transition hover:bg-[var(--site-primary-soft)]"
            >
              {brandMode === 'inside' ? 'Already have an account?' : 'Create account'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <div className="relative flex flex-1 items-center py-8 lg:py-12">
          <div className="grid w-full items-stretch gap-8 overflow-hidden rounded-[2.25rem] border border-[var(--site-border)] bg-[var(--site-surface)] shadow-[0_32px_70px_var(--site-shadow)] lg:grid-cols-[1.08fr_0.92fr]">
            <div className="relative hidden overflow-hidden border-r border-[var(--site-border)] bg-[linear-gradient(180deg,var(--site-bg-soft),#f6fbff)] p-10 lg:block xl:p-14">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(120,151,183,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(120,151,183,0.12)_1px,transparent_1px)] bg-[size:2.4rem_2.4rem]" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--site-primary)] text-white shadow-[0_18px_36px_var(--site-shadow)]">
                    <Bot className="h-7 w-7" />
                  </div>
                  <div className={cn('text-4xl font-extrabold text-[var(--site-text)]', headingFont.className)}>
                    SkillForge
                  </div>
                </div>

                <div className="mt-16 max-w-[34rem]">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--site-primary)]/20 bg-[var(--site-primary-soft)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--site-primary)]">
                    AI-powered learning ecosystem
                  </div>
                  <h2
                    className={cn(
                      'mt-8 text-5xl font-extrabold leading-[1.04] tracking-[-0.05em] text-[var(--site-text)] xl:text-6xl',
                      headingFont.className,
                    )}
                  >
                    Master new skills with <span className="text-[var(--site-primary)]">AI precision.</span>
                  </h2>
                  <p className="mt-6 max-w-[30rem] text-2xl leading-10 text-[var(--site-muted)]">
                    Join thousands of learners accelerating their careers with personalized, AI-driven
                    learning paths.
                  </p>

                  <div className="mt-12 rounded-[2rem] border border-[var(--site-border)] bg-white/80 p-8 shadow-[0_24px_50px_var(--site-shadow)] backdrop-blur">
                    <div className="space-y-5 text-sm leading-8 text-[var(--site-muted)]">
                      <div className="font-semibold text-[var(--site-text)]">Guided learning paths</div>
                      <div>Move through focused courses with clear modules, checkpoints, and steady progress.</div>
                      <div className="font-semibold text-[var(--site-text)]">Course-side AI support</div>
                      <div>Ask for simpler explanations, examples, quizzes, and study help inside each course.</div>
                      <div className="font-semibold text-[var(--site-text)]">Visible momentum</div>
                      <div>Track streaks, badges, and completed work as your learning plan grows.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 xl:p-12">
              {brandMode === 'inside' ? (
                <div className="mb-6 flex justify-center lg:hidden">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
                    <Bot className="h-8 w-8" />
                  </div>
                </div>
              ) : null}

              <div className={cn('mx-auto max-w-[36rem]', contentClassName)}>
                <div className={cn('mb-8', brandMode === 'inside' && 'text-center lg:text-left')}>
                  <h1 className={cn('text-4xl font-extrabold tracking-tight text-[var(--site-text)] sm:text-5xl', headingFont.className)}>
                    {title}
                  </h1>
                  <p className="mt-4 text-xl leading-8 text-[var(--site-muted)]">{subtitle}</p>
                </div>

                {children}
                <div className="mt-10 text-center text-base text-[var(--site-muted)]">{footer}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

type AuthInputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ComponentType<{ className?: string }>;
  rightAdornment?: React.ReactNode;
};

export const AuthInputField = React.forwardRef<HTMLInputElement, AuthInputFieldProps>(
  ({ className, icon: Icon, rightAdornment, ...props }, ref) => {
    return (
      <div className="relative">
        <div className="flex h-16 items-center rounded-[1.35rem] border border-[var(--site-border)] bg-[var(--site-bg-soft)] px-4 text-[var(--site-text)] transition focus-within:border-[var(--site-primary)] focus-within:shadow-[0_0_0_1px_rgba(47,155,255,0.18)]">
          <Icon className="h-5 w-5 text-[var(--site-subtle)]" />
          <input
            ref={ref}
            className={cn(
              'ml-4 h-full w-full bg-transparent text-[1.05rem] text-[var(--site-text)] outline-none placeholder:text-[var(--site-subtle)]',
              className,
            )}
            {...props}
          />
          {rightAdornment ? <div className="ml-3 shrink-0">{rightAdornment}</div> : null}
        </div>
      </div>
    );
  },
);

AuthInputField.displayName = 'AuthInputField';

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-[var(--site-border)]" />
      <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--site-subtle)]">
        {label}
      </div>
      <div className="h-px flex-1 bg-[var(--site-border)]" />
    </div>
  );
}

export function AuthSecondaryButton({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled
      className="inline-flex h-14 w-full items-center justify-center rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 text-base font-semibold text-[var(--site-text)] opacity-75"
    >
      {children}
    </button>
  );
}
