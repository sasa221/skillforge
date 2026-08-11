import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Bot,
  Briefcase,
  CheckCircle2,
  Clock3,
  Layers3,
  Map,
  Rocket,
  Shield,
  Sparkles,
  Target,
  Workflow,
  ArrowUpRight,
} from 'lucide-react';

import { apiGet } from '@/lib/api';
import type { SiteSurface, SiteSurfaceCard } from '@/lib/content/types';
import { headingFont } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { PublicShell } from './PublicShell';

const iconMap = {
  award: Award,
  bot: Bot,
  briefcase: Briefcase,
  clock3: Clock3,
  layers3: Layers3,
  map: Map,
  rocket: Rocket,
  shield: Shield,
  sparkles: Sparkles,
  target: Target,
  workflow: Workflow,
} as const;

async function getSurface(slug: string) {
  return apiGet<SiteSurface>(`/site-surfaces/${slug}`);
}

const sectionTitles: Record<string, string> = {
  community: 'What learners can find here',
  methodology: 'How the learning model works',
  'learning-path': 'How the path stays clear',
  certificates: 'How progress and completion stay organized',
  support: 'How to get help quickly',
  'privacy-policy': 'What this policy covers',
  'terms-of-service': 'What these terms explain',
};

const railTitles: Record<string, string> = {
  community: 'Inside the community',
  methodology: 'Inside the learning model',
  'learning-path': 'Inside the path view',
  certificates: 'Inside completion tracking',
  support: 'Inside support',
  'privacy-policy': 'Inside the policy',
  'terms-of-service': 'Inside the terms',
};

const railDescriptions: Record<string, string> = {
  community: 'A quick look at the spaces, replies, and updates learners can expect here.',
  methodology: 'A quick view of the ideas that shape pacing, checkpoints, and support.',
  'learning-path': 'A quick look at how milestones, sequencing, and next steps stay visible.',
  certificates: 'A quick view of how completion, recognition, and proof of progress fit together.',
  support: 'A quick view of the help paths available when learners get stuck or need clarity.',
  'privacy-policy': 'A quick view of the privacy areas learners usually care about first.',
  'terms-of-service': 'A quick view of the responsibilities and protections covered on this page.',
};

const relatedLinks: Record<string, Array<{ href: string; label: string }>> = {
  community: [
    { href: '/courses', label: 'Browse courses' },
    { href: '/learning-path', label: 'Learning paths' },
    { href: '/support', label: 'Support' },
  ],
  methodology: [
    { href: '/courses', label: 'Course catalog' },
    { href: '/learning-path', label: 'Learning paths' },
    { href: '/certificates', label: 'Certificates' },
  ],
  'learning-path': [
    { href: '/courses', label: 'Course catalog' },
    { href: '/methodology', label: 'Methodology' },
    { href: '/certificates', label: 'Certificates' },
  ],
  certificates: [
    { href: '/learning-path', label: 'Learning paths' },
    { href: '/courses', label: 'Course catalog' },
    { href: '/support', label: 'Support' },
  ],
  support: [
    { href: '/courses', label: 'Course catalog' },
    { href: '/privacy-policy', label: 'Privacy policy' },
    { href: '/terms-of-service', label: 'Terms of service' },
  ],
  'privacy-policy': [
    { href: '/terms-of-service', label: 'Terms of service' },
    { href: '/support', label: 'Support' },
    { href: '/courses', label: 'Course catalog' },
  ],
  'terms-of-service': [
    { href: '/privacy-policy', label: 'Privacy policy' },
    { href: '/support', label: 'Support' },
    { href: '/courses', label: 'Course catalog' },
  ],
};

const relatedDescriptions: Record<string, string> = {
  '/courses': 'Move into the active catalog and pick the next course to work on.',
  '/learning-path': 'See how courses connect into a guided sequence instead of isolated lessons.',
  '/support': 'Get help, policies, and clear answers when you need them.',
  '/certificates': 'See how completed work turns into visible proof and milestones.',
  '/methodology': 'Understand the learning system behind pacing, checkpoints, and coaching.',
  '/pricing': 'Compare plans and decide how you want to start learning.',
  '/privacy-policy': 'Review how learner data is handled across the product.',
  '/terms-of-service': 'Review the usage terms that shape the product experience.',
};

export async function SiteSurfacePage({ slug }: { slug: string }) {
  try {
    const surface = await getSurface(slug);
    const cards = Array.isArray(surface.cards) ? surface.cards : [];
    const links = relatedLinks[slug] ?? [
      { href: '/courses', label: 'Course catalog' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/support', label: 'Support' },
    ];
    const detailHeading = sectionTitles[slug] ?? 'What you can explore here';
    const railTitle = railTitles[slug] ?? 'Inside this area';
    const railDescription =
      railDescriptions[slug] ?? 'A quick view of the ideas, tools, and next steps tied to this page.';

    return (
      <PublicShell>
        <main className="bg-[radial-gradient(circle_at_top,var(--site-primary-soft),transparent_30%),var(--site-bg)] transition-colors">
          <section className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:px-8 lg:py-20">
            <div className="max-w-2xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary-soft)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--site-primary)]">
                <Sparkles className="h-3.5 w-3.5" />
                {surface.eyebrow ?? 'Explore'}
              </div>

              <div className="space-y-4">
                <h1
                  className={cn(
                    'text-4xl font-extrabold leading-tight text-[var(--site-text)] md:text-6xl',
                    headingFont.className,
                  )}
                >
                  {surface.title}
                </h1>
                {surface.description ? (
                  <p className="max-w-2xl text-lg leading-8 text-[var(--site-muted)]">
                    {surface.description}
                  </p>
                ) : null}
                {surface.body ? (
                  <p className="max-w-2xl text-base leading-8 text-[var(--site-muted)]">
                    {surface.body}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                {surface.primaryCtaLabel && surface.primaryCtaHref ? (
                  <Link
                    href={surface.primaryCtaHref}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)]"
                  >
                    {surface.primaryCtaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}

                {surface.secondaryCtaLabel && surface.secondaryCtaHref ? (
                  <Link
                    href={surface.secondaryCtaHref}
                    className="inline-flex items-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-5 py-3 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-alt)]"
                  >
                    {surface.secondaryCtaLabel}
                  </Link>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--site-subtle)] transition hover:bg-[var(--site-primary-soft)] hover:text-[var(--site-primary)]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="w-full max-w-[460px] rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_30px_60px_var(--site-shadow)]">
              <div className="mb-5 space-y-2">
                <div className="text-sm font-extrabold uppercase tracking-[0.22em] text-[var(--site-subtle)]">
                  {railTitle}
                </div>
                <p className="text-sm leading-7 text-[var(--site-muted)]">{railDescription}</p>
              </div>
              <div className="grid gap-4">
                {cards.length > 0 ? (
                  cards.map((card) => <SurfaceCard key={`${card.title}-${card.icon}`} card={card} />)
                ) : (
                  <div className="rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5 text-sm leading-7 text-[var(--site-muted)]">
                    This section will highlight the most useful details, next steps, and related actions for this page.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[1180px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-8 shadow-[0_24px_50px_var(--site-shadow)]">
                <div className="text-sm font-extrabold uppercase tracking-[0.24em] text-[var(--site-subtle)]">
                  {detailHeading}
                </div>
                <div className="mt-6 grid gap-4">
                  {surface.bullets.map((bullet, index) => (
                    <div
                      key={bullet}
                      className="flex items-start gap-4 rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 py-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--site-primary-soft)] text-sm font-extrabold text-[var(--site-primary)]">
                        {index + 1}
                      </div>
                      <div className="pt-1 text-sm leading-7 text-[var(--site-muted)]">{bullet}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-8 shadow-[0_24px_50px_var(--site-shadow)]">
                <div className="text-sm font-extrabold uppercase tracking-[0.24em] text-[var(--site-subtle)]">
                  Keep exploring
                </div>
                <div className="mt-3 text-base leading-7 text-[var(--site-muted)]">
                  Move from this page into the next part of the product without losing the thread of
                  your learning journey.
                </div>

                <div className="mt-6 grid gap-4">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 py-5 transition hover:border-[var(--site-border-strong)] hover:bg-[var(--site-primary-soft)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.18em] text-[var(--site-primary)]">
                            <CheckCircle2 className="h-4 w-4" />
                            {link.label}
                          </div>
                          <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
                            {relatedDescriptions[link.href] ?? 'Open the next section and keep exploring SkillForge.'}
                          </p>
                        </div>
                        <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-[var(--site-subtle)] transition group-hover:text-[var(--site-primary)]" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      </PublicShell>
    );
  } catch (error) {
    return (
      <PublicShell>
        <main className="mx-auto w-full max-w-[980px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="rounded-[2rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-8 shadow-[0_20px_40px_var(--site-shadow)]">
            <div className="text-sm font-extrabold uppercase tracking-[0.24em] text-[var(--site-danger)]">
              Page temporarily unavailable
            </div>
            <h1 className={cn('mt-4 text-4xl font-extrabold text-[var(--site-text)]', headingFont.className)}>
              Could not load this page right now
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--site-muted)]">
              {error instanceof Error
                ? error.message
                : 'We could not load this page right now. Please try again in a moment.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center rounded-full bg-[var(--site-primary)] px-5 py-3 text-sm font-semibold text-white"
              >
                Back home
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-5 py-3 text-sm font-semibold text-[var(--site-text)]"
              >
                Browse courses
              </Link>
            </div>
          </div>
        </main>
      </PublicShell>
    );
  }
}

function SurfaceCard({ card }: { card: SiteSurfaceCard }) {
  const Icon = iconMap[(card.icon as keyof typeof iconMap) ?? 'workflow'] ?? Workflow;

  return (
    <div className="rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-lg font-bold text-[var(--site-text)]">{card.title}</div>
      <p className="mt-2 text-sm leading-7 text-[var(--site-muted)]">{card.description}</p>
    </div>
  );
}
