'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronDown, LifeBuoy, RefreshCcw, LayoutGrid, Puzzle } from 'lucide-react';

import { PublicShell } from '@/components/site/PublicShell';
import { headingFont } from '@/lib/fonts';
import { cn } from '@/lib/utils';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PublicShell>
      <main className="bg-[radial-gradient(circle_at_top,var(--site-primary-soft),transparent_30%),var(--site-bg)]">
        <section className="mx-auto flex w-full max-w-[980px] flex-col items-center px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <div className="flex h-40 w-40 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] shadow-[0_24px_54px_var(--site-shadow)]">
            <div className="flex h-24 w-24 items-center justify-center rounded-[1.8rem] bg-[var(--site-primary-soft)] text-[var(--site-primary)] shadow-[0_18px_34px_var(--site-shadow)]">
              <Puzzle className="h-12 w-12" />
            </div>
          </div>

          <h1
            className={cn(
              'mt-10 text-5xl font-extrabold tracking-[-0.05em] text-[var(--site-text)] sm:text-6xl',
              headingFont.className,
            )}
          >
            Something went wrong
          </h1>
          <p className="mt-6 max-w-[720px] text-xl leading-9 text-[var(--site-muted)]">
            We hit an unexpected issue while loading this page. Your progress is safe, and we can retry
            from here without interrupting your learning flow.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary)] px-6 py-4 text-lg font-semibold text-white shadow-[0_18px_34px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)]"
            >
              <RefreshCcw className="h-5 w-5" />
              Try Again
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-6 py-4 text-lg font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-alt)]"
            >
              <LayoutGrid className="h-5 w-5" />
              Dashboard
            </Link>
          </div>

          <div className="mt-10 w-full max-w-[700px] rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-4 text-left shadow-[0_16px_30px_var(--site-shadow)]">
            <div className="flex items-center justify-between gap-4 text-base font-semibold text-[var(--site-text)]">
              <div>View error details</div>
              <ChevronDown className="h-5 w-5 text-[var(--site-subtle)]" />
            </div>
            <div className="mt-4 rounded-[1rem] bg-[var(--site-surface-alt)] p-4 text-sm leading-7 text-[var(--site-muted)]">
              {error.message || 'Unknown client error'}
            </div>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-[var(--site-muted)]">
            <Link href="/support" className="inline-flex items-center gap-2 transition hover:text-[var(--site-primary)]">
              <LifeBuoy className="h-4 w-4" />
              Contact Support
            </Link>
            <Link href="/courses" className="inline-flex items-center gap-2 transition hover:text-[var(--site-primary)]">
              <BookOpen className="h-4 w-4" />
              Browse Courses
            </Link>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
