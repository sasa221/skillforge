import Link from 'next/link';
import { Bot, Home, Search } from 'lucide-react';

import { headingFont } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { PublicShell } from '@/components/site/PublicShell';

export default function NotFound() {
  return (
    <PublicShell>
      <main className="bg-[radial-gradient(circle_at_top,var(--site-primary-soft),transparent_30%),var(--site-bg)]">
        <section className="mx-auto flex w-full max-w-[980px] flex-col items-center px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <div className="flex h-44 w-44 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] shadow-[0_24px_54px_var(--site-shadow)]">
            <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
              <Bot className="h-14 w-14" />
              <div className="absolute -right-3 -top-3 rounded-2xl bg-[var(--site-surface)] px-4 py-3 text-xl font-bold text-[var(--site-warm)] shadow-[0_12px_24px_var(--site-shadow)]">
                ?
              </div>
            </div>
          </div>

          <h1
            className={cn(
              'mt-10 max-w-[720px] text-5xl font-extrabold leading-[0.96] tracking-[-0.05em] text-[var(--site-text)] sm:text-6xl',
              headingFont.className,
            )}
          >
            Class dismissed? Not quite.
          </h1>
          <p className="mt-6 max-w-[700px] text-xl leading-9 text-[var(--site-muted)]">
            We could not find the page you were looking for. Let&apos;s get you back to a course or
            another part of SkillForge that is ready to explore.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary)] px-6 py-4 text-lg font-semibold text-white shadow-[0_18px_34px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)]"
            >
              <Home className="h-5 w-5" />
              Back to Home
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-6 py-4 text-lg font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-alt)]"
            >
              <Search className="h-5 w-5" />
              Explore Courses
            </Link>
          </div>

          <div className="mt-14 flex flex-wrap justify-center gap-8 text-sm text-[var(--site-muted)]">
            <Link href="/support" className="transition hover:text-[var(--site-primary)]">
              Contact Support
            </Link>
            <Link href="/learning-path" className="transition hover:text-[var(--site-primary)]">
              Learning Path
            </Link>
            <Link href="/community" className="transition hover:text-[var(--site-primary)]">
              Community
            </Link>
            <Link href="/courses" className="transition hover:text-[var(--site-primary)]">
              Course Catalog
            </Link>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
