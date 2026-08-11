import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';

import { PublicShell } from '@/components/site/PublicShell';
import { headingFont } from '@/lib/fonts';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Starter',
    price: '$0',
    period: '/month',
    description: 'Start with the course library and a clean learning flow.',
    features: [
      'Public course access',
      'Basic progress tracking',
      'Community access',
    ],
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'Best for learners who want structured progression and deeper AI support.',
    features: [
      'Full learning library',
      'AI lesson support',
      'Completion records and certificates',
    ],
    featured: true,
  },
  {
    name: 'Teams',
    price: '$79',
    period: '/month',
    description: 'For organizations that want cohorts, admin controls, and clearer team learning visibility.',
    features: [
      'Admin tooling',
      'Team rollout support',
      'Team reporting support',
    ],
  },
];

export default function PricingPage() {
  return (
    <PublicShell>
      <main className="bg-[radial-gradient(circle_at_top,var(--site-primary-soft),transparent_26%),linear-gradient(180deg,var(--site-bg-soft)_0%,var(--site-bg)_54%,var(--site-bg-soft)_100%)]">
        <section className="mx-auto w-full max-w-[1180px] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_22px_48px_var(--site-shadow)] lg:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary-soft)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--site-primary)]">
              <Sparkles className="h-3.5 w-3.5" />
              Pricing
            </div>
            <h1 className={cn('mt-5 text-5xl font-extrabold tracking-[-0.05em] text-[var(--site-text)] sm:text-6xl', headingFont.className)}>
              Plans for individual learners and growing teams
            </h1>
            <p className="mt-4 max-w-[760px] text-lg leading-8 text-[var(--site-muted)]">
              Choose a plan that matches how you want to learn today, with room to grow into AI support,
              structured paths, and team-based learning.
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'rounded-[1.9rem] border p-6 shadow-[0_22px_44px_var(--site-shadow)]',
                  plan.featured
                    ? 'border-[var(--site-border-strong)] bg-[linear-gradient(180deg,var(--site-primary-soft)_0%,var(--site-surface)_100%)]'
                    : 'border-[var(--site-border)] bg-[var(--site-surface)]',
                )}
              >
                <div className="text-sm font-extrabold uppercase tracking-[0.22em] text-[var(--site-primary)]">
                  {plan.name}
                </div>
                <div className="mt-5 flex items-end gap-2">
                  <div className="text-6xl font-extrabold text-[var(--site-text)]">{plan.price}</div>
                  <div className="pb-2 text-lg text-[var(--site-muted)]">{plan.period}</div>
                </div>
                <div className="mt-4 text-base leading-8 text-[var(--site-muted)]">{plan.description}</div>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 text-[var(--site-muted)]">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
                        <Check className="h-4 w-4" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/signup"
                  className={cn(
                    'mt-8 inline-flex h-14 w-full items-center justify-center rounded-full text-base font-semibold transition',
                    plan.featured
                      ? 'bg-[var(--site-primary)] text-white shadow-[0_20px_38px_var(--site-shadow)] hover:bg-[var(--site-primary-strong)]'
                      : 'border border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-text)] hover:bg-[var(--site-surface-alt)]',
                  )}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
