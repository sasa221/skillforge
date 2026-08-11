import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  BrainCircuit,
  ChartNoAxesCombined,
  CirclePlay,
  Clock3,
  Gem,
  Sparkles,
  Users,
} from 'lucide-react';

import { CourseArtwork } from '@/components/site/CourseArtwork';
import { CourseInstructorIdentity } from '@/components/site/CourseInstructorIdentity';
import { InstructorPathMini } from '@/components/site/InstructorPathMini';
import { CourseInstructorSpotlight } from '@/components/site/CourseInstructorSpotlight';
import { PublicShell } from '@/components/site/PublicShell';
import { Hero3DScene } from '@/components/3d/Hero3DScene';
import { Card3DTilt } from '@/components/3d/Card3DTilt';
import { Glass3DCard, Glass3DLayer } from '@/components/3d/Glass3DCard';
import { ParticleBackground } from '@/components/3d/ParticleBackground';
import { apiGet } from '@/lib/api';
import type { Course, SiteSurface, SiteSurfaceCard } from '@/lib/content/types';
import { resolveCourseCoverUrl } from '@/lib/content/media';
import { headingFont } from '@/lib/fonts';
import { cn } from '@/lib/utils';

const highlights = [
  {
    title: 'Interactive',
    description:
      'Short lessons, practical checkpoints, and guided exercises that keep learning active instead of passive.',
    icon: Sparkles,
    tone: 'bg-[var(--site-primary-soft)] text-[var(--site-primary)]',
  },
  {
    title: 'AI-Powered',
    description:
      'Ask for explanations, examples, summaries, and quiz help from an AI tutor that stays close to the course context.',
    icon: Bot,
    tone: 'bg-[var(--site-warm-soft)] text-[var(--site-warm)]',
  },
  {
    title: 'Gamified',
    description:
      'Progress, streaks, badges, and checkpoints help learners stay consistent while moving through the catalog.',
    icon: BadgeCheck,
    tone: 'bg-[var(--site-primary-soft)] text-[var(--site-primary)]',
  },
];

const steps = [
  {
    number: '1',
    title: 'Choose Your Path',
    description:
      'Start with a practical course that matches your level and the skill you want to build next.',
  },
  {
    number: '2',
    title: 'Learn by Doing',
    description:
      'Work through compact modules, lesson checkpoints, and guided examples that build confidence step by step.',
  },
  {
    number: '3',
    title: 'Get Certified',
    description:
      'Complete the path, pass the checkpoints, and finish with a course record that shows what you learned.',
  },
];

const defaultMetricCards: HomeMetricCard[] = [
  { value: '4', label: 'Published courses', accent: 'primary', helper: 'Available in the course catalog' },
  { value: '12', label: 'Guided modules', accent: 'warm', helper: 'Structured learning steps across courses' },
  { value: '18', label: 'Lesson blocks', accent: 'primary', helper: 'Core lesson content ready to study' },
  { value: '6', label: 'Quiz checkpoints', accent: 'warm', helper: 'Short checks that help you confirm what you learned' },
];

export default async function HomePage() {
  const [homeSurface, liveCourses] = await Promise.all([getHomeSurface(), getPublishedCourses()]);
  const featuredCourses = liveCourses.slice(0, 3);
  const featuredInstructors = getFeaturedInstructors(liveCourses);
  const heroMedia = getHomeHeroMedia(homeSurface);
  const socialProof = getHomeSocialProof(homeSurface);
  const metricCards = getHomeMetricCards(homeSurface);
  const heroEyebrow = homeSurface?.eyebrow ?? 'Guided AI learning';
  const heroTitle = homeSurface?.title ?? 'Master New Skills with [[AI-Powered]] Learning';
  const heroDescription =
    homeSurface?.description ??
    'Build real skills through guided courses, compact modules, and AI help that stays close to what you are learning.';
  const heroBody = homeSurface?.body ?? null;
  const primaryCtaLabel = homeSurface?.primaryCtaLabel ?? 'Start Learning Free';
  const primaryCtaHref = homeSurface?.primaryCtaHref ?? '/signup';
  const secondaryCtaLabel = homeSurface?.secondaryCtaLabel ?? 'See how it works';
  const secondaryCtaHref = homeSurface?.secondaryCtaHref ?? '#how-it-works';

  return (
    <PublicShell>
      <main className="bg-[radial-gradient(circle_at_top,var(--site-primary-soft),transparent_26%),linear-gradient(180deg,var(--site-bg-soft)_0%,var(--site-bg)_58%,var(--site-bg-soft)_100%)]">
        <section className="mx-auto grid w-full max-w-[1180px] gap-12 px-4 pb-14 pt-2 sm:px-6 sm:pt-3 lg:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)] lg:items-center lg:px-8 lg:pb-20 lg:pt-4">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--site-warm-soft)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--site-warm)]">
              <Sparkles className="h-3.5 w-3.5" />
              {heroEyebrow}
            </div>

            <div className="max-w-[620px] space-y-5">
              <h1 className={cn('text-5xl font-extrabold leading-[0.96] tracking-[-0.05em] text-[var(--site-text)] sm:text-6xl', headingFont.className)}>
                {renderHeroTitle(heroTitle)}
              </h1>
              <p className="max-w-[560px] text-lg leading-8 text-[var(--site-muted)]">
                {heroDescription}
              </p>
              {heroBody ? (
                <p className="max-w-[560px] text-base leading-7 text-[var(--site-subtle)]">{heroBody}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={primaryCtaHref}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_20px_38px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)]"
              >
                {primaryCtaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={secondaryCtaHref}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-6 py-3.5 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-alt)]"
              >
                <CirclePlay className="h-4 w-4" />
                {secondaryCtaLabel}
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--site-muted)]">
              <div className="flex -space-x-2">
                {socialProof.avatars.map((avatar, index) => (
                  <div
                    key={`${avatar.name}-${index}`}
                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--site-surface)] bg-[var(--site-primary-soft)] text-xs font-semibold text-[var(--site-primary)] shadow-[0_10px_20px_var(--site-shadow)]"
                    style={avatar.color ? { backgroundColor: avatar.color } : undefined}
                    title={avatar.name}
                  >
                    {avatar.avatarUrl ? (
                      <img
                        src={avatar.avatarUrl}
                        alt={avatar.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      getInitials(avatar.name)
                    )}
                  </div>
                ))}
              </div>
              <span>
                {socialProof.prefix}{' '}
                <span className="font-semibold text-[var(--site-text)]">{socialProof.value}</span>{' '}
                {socialProof.suffix}
              </span>
            </div>
          </div>

            <div className="relative min-h-[480px]">
              <Card3DTilt maxTilt={10} className="h-full w-full">
                <div className="relative overflow-hidden rounded-[2.2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_35px_80px_var(--site-shadow)] backdrop-blur-xl">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 shadow-[0_14px_30px_var(--site-shadow)]">
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[var(--site-subtle)]">
                        {heroMedia.badgeLabel}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-lg font-extrabold text-[var(--site-text)]">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--site-success-soft)] text-[var(--site-success)]">
                          <BrainCircuit className="h-4 w-4" />
                        </span>
                        {heroMedia.badgeValue}
                      </div>
                    </div>

                    <div className="inline-flex items-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--site-muted)] shadow-[0_12px_24px_var(--site-shadow)]">
                      {heroMedia.floatingLabel}
                    </div>
                  </div>

                  {/* Real-time WebGL 3D Interactive Canvas Scene */}
                  <div className="relative h-[380px] w-full overflow-hidden rounded-[1.6rem] border border-[var(--site-border)] bg-gradient-to-b from-slate-950/80 via-indigo-950/40 to-slate-950/90 shadow-2xl">
                    <Hero3DScene />
                  </div>

                  <div className="mt-4 rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 py-4">
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--site-subtle)]">
                      {heroMedia.captionEyebrow}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[var(--site-muted)]">{heroMedia.captionText}</p>
                  </div>
                </div>
              </Card3DTilt>
            </div>
          </section>

        <section className="border-y border-[var(--site-border)] bg-[var(--site-surface)] backdrop-blur-xl">
          <div className="mx-auto grid w-full max-w-[1180px] gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {metricCards.map((metric) => (
              <Card3DTilt key={metric.label} maxTilt={14} glareOpacity={0.2}>
                <div className="h-full rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-5 py-5 shadow-[0_16px_32px_var(--site-shadow)]">
                  <div className={cn('text-3xl font-extrabold', getHomeMetricAccent(metric.accent), headingFont.className)}>
                    {metric.value}
                  </div>
                  <div className="mt-1 text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--site-subtle)]">
                    {metric.label}
                  </div>
                  <div className="mt-3 text-sm text-[var(--site-muted)]">{metric.helper}</div>
                </div>
              </Card3DTilt>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1180px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-[760px] text-center">
            <h2 className={cn('text-4xl font-extrabold tracking-[-0.04em] text-[var(--site-text)]', headingFont.className)}>
              Why Choose SkillForge?
            </h2>
            <p className="mt-4 text-lg leading-8 text-[var(--site-muted)]">
              Learn in a cleaner flow that keeps courses, progress, AI guidance, and milestones in one consistent experience.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {highlights.map((item) => (
              <Card3DTilt key={item.title} maxTilt={12}>
                <div className="h-full rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_36px_var(--site-shadow)]">
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', item.tone)}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-5 text-xl font-bold text-[var(--site-text)]">{item.title}</div>
                  <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">{item.description}</p>
                </div>
              </Card3DTilt>
            ))}
          </div>
        </section>

        <section className="bg-[var(--site-bg-soft)] py-16 lg:py-20">
          <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-sm font-extrabold uppercase tracking-[0.24em] text-[var(--site-subtle)]">
                  Popular courses
                </div>
                <h2 className={cn('mt-2 text-4xl font-extrabold tracking-[-0.04em] text-[var(--site-text)]', headingFont.className)}>
                  Learn from the course library
                </h2>
                <p className="mt-3 max-w-[640px] text-base leading-7 text-[var(--site-muted)]">
                  Explore practical courses with real titles, cover images, guided modules, and clear next steps for learners.
                </p>
              </div>
              <Link href="/courses" className="text-sm font-semibold text-[var(--site-primary)] transition hover:text-[var(--site-primary-strong)]">
                Browse all courses
              </Link>
            </div>

            {featuredCourses.length === 0 ? (
              <div className="mt-8 rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 text-sm text-[var(--site-muted)] shadow-[0_16px_32px_var(--site-shadow)]">
                New courses will appear here as soon as they are published.
              </div>
            ) : (
              <div className="mt-8 grid gap-5 lg:grid-cols-3">
                {featuredCourses.map((course, index) => (
                  <Glass3DCard key={course.id} maxTilt={15} glowColor="cyan" className="p-0">
                    <Link href={`/courses/${course.slug}`} className="block overflow-hidden rounded-[2rem]">
                      <Glass3DLayer depth={10}>
                        <CourseArtwork
                          index={index}
                          label={course.difficulty}
                          imageUrl={resolveCourseCoverUrl(course)}
                          imageAlt={course.title}
                          className="h-[220px] rounded-none rounded-t-[2rem]"
                        />
                      </Glass3DLayer>
                      <div className="space-y-4 p-6">
                        <Glass3DLayer depth={20}>
                          <div className="flex items-center gap-3 text-sm text-[var(--site-muted)]">
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="h-4 w-4 text-cyan-400" />
                              {course.estimatedMinutes ? `${Math.max(1, Math.round(course.estimatedMinutes / 60))}h` : 'Self paced'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-4 w-4 text-indigo-400" />
                              {getCourseMetaLabel(course)}
                            </span>
                          </div>
                        </Glass3DLayer>

                        <Glass3DLayer depth={30}>
                          <h3 className="text-2xl font-bold leading-tight text-[var(--site-text)]">{course.title}</h3>
                          {course.instructor ? (<CourseInstructorIdentity instructor={course.instructor} className="mt-3" />) : null}
                          <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--site-muted)]">
                            {course.description ?? 'A guided course path designed to help learners move from basics to confident execution.'}
                          </p>
                        </Glass3DLayer>

                        <Glass3DLayer depth={45}>
                          <div className="flex items-center justify-between pt-2">
                            <div className="text-sm font-semibold text-[var(--site-muted)] capitalize">
                              {course.difficulty} course
                            </div>
                            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary)] px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-[var(--site-primary-strong)]">
                              View Course
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </div>
                        </Glass3DLayer>
                      </div>
                    </Link>
                  </Glass3DCard>
                ))}
              </div>
            )}
          </div>
        </section>

        {featuredInstructors.length > 0 ? (
          <section className="mx-auto w-full max-w-[1180px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-sm font-extrabold uppercase tracking-[0.24em] text-[var(--site-subtle)]">
                  Featured instructors
                </div>
                <h2 className={cn('mt-2 text-4xl font-extrabold tracking-[-0.04em] text-[var(--site-text)]', headingFont.className)}>
                  Learn with instructors who stay close to the work
                </h2>
                <p className="mt-3 max-w-[680px] text-base leading-7 text-[var(--site-muted)]">
                  Meet a few of the instructors guiding the examples, pacing, and checkpoints across the course library.
                </p>
              </div>
              <Link href="/instructors" className="text-sm font-semibold text-[var(--site-primary)] transition hover:text-[var(--site-primary-strong)]">
                Explore instructors
              </Link>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {featuredInstructors.map((entry) => (
                <div key={entry.instructor.id} className="space-y-4">
                  <CourseInstructorSpotlight
                    instructor={entry.instructor}
                    eyebrow="Instructor spotlight"
                    title={`Teaching ${entry.course.title}`}
                    description={
                      entry.instructor.bio ??
                      `Start with ${entry.course.title} to learn through a guided path shaped by ${entry.instructor.fullName}.`
                    }
                    ctaHref={`/instructors/${entry.instructor.slug}`}
                    ctaLabel="View profile"
                  />
                  <InstructorPathMini courses={liveCourses.filter((course) => course.instructor?.id === entry.instructor.id)} anchorCourse={entry.course} />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section id="how-it-works" className="mx-auto w-full max-w-[1180px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-[680px] text-center">
            <h2 className={cn('text-4xl font-extrabold tracking-[-0.04em] text-[var(--site-text)]', headingFont.className)}>
              How It Works
            </h2>
            <p className="mt-4 text-lg leading-8 text-[var(--site-muted)]">
              Follow a simple learning loop: choose a path, move through guided modules, and prove understanding with checkpoints.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.number} className="relative rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 text-center shadow-[0_18px_36px_var(--site-shadow)]">
                {index < steps.length - 1 ? (
                  <div className="absolute right-[-16px] top-[52px] hidden h-px w-8 bg-[var(--site-border)] md:block" />
                ) : null}
                <div className={cn(
                  'mx-auto flex h-14 w-14 items-center justify-center rounded-full text-xl font-extrabold text-white',
                  index === 1 ? 'bg-[var(--site-warm)]' : 'bg-[var(--site-primary)]',
                )}>
                  {step.number}
                </div>
                <div className="mt-5 text-2xl font-bold text-[var(--site-text)]">{step.title}</div>
                <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1180px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-24">
          <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#10213c_0%,#132e55_46%,#1b1f34_100%)] px-6 py-10 text-white shadow-[0_30px_60px_rgba(15,31,56,0.16)] md:px-10 md:py-12">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.46fr)] lg:items-center">
              <div className="max-w-[620px]">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.24em] text-[#9dd6ff]">
                  <Gem className="h-3.5 w-3.5" />
                  Ready to keep learning
                </div>
                <h2 className={cn('mt-5 text-4xl font-extrabold leading-tight tracking-[-0.04em] md:text-5xl', headingFont.className)}>
                  Ready to Forge Your Future?
                </h2>
                <p className="mt-4 text-lg leading-8 text-[#d2def0]">
                  Start with a practical course now, keep your progress moving, and use built-in AI support whenever you need a clearer explanation.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-[#2f9bff] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(47,155,255,0.24)] transition hover:bg-[#168cf2]"
                >
                  Get Started Now
                </Link>
                <Link
                  href="/community"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Talk to the Community
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}

async function getHomeSurface() {
  try {
    return await apiGet<SiteSurface>('/site-surfaces/home');
  } catch {
    return undefined;
  }
}

async function getPublishedCourses() {
  try {
    return await apiGet<Course[]>('/courses');
  } catch {
    return [];
  }
}

type HomeHeroMedia = {
  imageUrl: string;
  imageAlt: string;
  badgeLabel: string;
  badgeValue: string;
  floatingLabel: string;
  captionEyebrow: string;
  captionText: string;
};

type HomeSocialProof = {
  prefix: string;
  value: string;
  suffix: string;
  avatars: Array<{ name: string; avatarUrl: string | null; color: string | null }>;
};

type HomeMetricCard = {
  value: string;
  label: string;
  helper: string;
  accent: 'primary' | 'warm' | 'success';
};

function renderHeroTitle(title: string) {
  const marked = title.match(/\[\[(.+?)\]\]/);
  if (!marked) return title;

  const highlighted = marked[1];
  const [before, after] = title.split(`[[${highlighted}]]`);

  return (
    <>
      {before}
      <span className="bg-[linear-gradient(180deg,var(--site-primary)_0%,#7ec9ff_100%)] bg-clip-text text-transparent">
        {highlighted}
      </span>
      {after}
    </>
  );
}

function getHomeHeroMedia(surface?: SiteSurface): HomeHeroMedia {
  const fallback: HomeHeroMedia = {
    imageUrl:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Students collaborating around a laptop during a practical learning session',
    badgeLabel: 'Course progress',
    badgeValue: '87%',
    floatingLabel: 'Guided session',
    captionEyebrow: 'Project-based learning',
    captionText:
      'Learn through guided sessions, practical examples, and AI help that supports the course instead of distracting from it.',
  };

  const card = Array.isArray(surface?.cards)
    ? (surface.cards.find((item) => isRecord(item) && item.type === 'hero_media') as
        | SiteSurfaceCard
        | undefined)
    : undefined;

  if (!card) return fallback;

  return {
    imageUrl: stringOrDefault(card.imageUrl, fallback.imageUrl),
    imageAlt: stringOrDefault(card.imageAlt, fallback.imageAlt),
    badgeLabel: stringOrDefault(card.badgeLabel, fallback.badgeLabel),
    badgeValue: stringOrDefault(card.badgeValue, fallback.badgeValue),
    floatingLabel: stringOrDefault(card.floatingLabel, fallback.floatingLabel),
    captionEyebrow: stringOrDefault(card.captionEyebrow, fallback.captionEyebrow),
    captionText: stringOrDefault(card.captionText, fallback.captionText),
  };
}

function getHomeSocialProof(surface?: SiteSurface): HomeSocialProof {
  const fallback: HomeSocialProof = {
    prefix: 'Joined by',
    value: '3',
    suffix: 'active learners on SkillForge',
    avatars: [
      { name: 'Amina Soliman', avatarUrl: null, color: '#ffd4b7' },
      { name: 'Omar Nabil', avatarUrl: null, color: '#b0d9ff' },
      { name: 'Lina Kareem', avatarUrl: null, color: '#f8e4a7' },
    ],
  };

  const card = Array.isArray(surface?.cards)
    ? (surface.cards.find((item) => isRecord(item) && item.type === 'social_proof') as
        | SiteSurfaceCard
        | undefined)
    : undefined;

  if (!card) return fallback;

  const avatars = Array.isArray(card.avatars)
    ? card.avatars
        .filter(isRecord)
        .map((avatar) => ({
          name: stringOrDefault(avatar.name, 'SkillForge learner'),
          avatarUrl: stringOrNull(avatar.avatarUrl),
          color: stringOrNull(avatar.color),
        }))
    : fallback.avatars;

  return {
    prefix: stringOrDefault(card.prefix, fallback.prefix),
    value: stringOrDefault(card.value, fallback.value),
    suffix: stringOrDefault(card.suffix, fallback.suffix),
    avatars: avatars.length > 0 ? avatars : fallback.avatars,
  };
}

function getHomeMetricCards(surface?: SiteSurface): HomeMetricCard[] {
  const cards = Array.isArray(surface?.cards)
    ? surface.cards
        .filter((item) => isRecord(item) && item.type === 'metric')
        .map((card) => ({
          value: stringOrDefault(card.value, '0'),
          label: stringOrDefault(card.label, 'Metric'),
          helper: stringOrDefault(card.helper, ''),
          accent: getHomeMetricAccentKey(card.accent),
        }))
    : [];

  return cards.length > 0 ? cards : defaultMetricCards;
}

function getHomeMetricAccentKey(value: unknown): HomeMetricCard['accent'] {
  if (value === 'warm' || value === 'success') {
    return value;
  }

  return 'primary';
}

function getHomeMetricAccent(accent: HomeMetricCard['accent']) {
  switch (accent) {
    case 'warm':
      return 'text-[var(--site-warm)]';
    case 'success':
      return 'text-[var(--site-success)]';
    default:
      return 'text-[var(--site-primary)]';
  }
}

function getCourseMetaLabel(course: { skills?: Array<unknown>; tags?: string[] }) {
  if (Array.isArray(course.skills) && course.skills.length > 0) {
    return `${course.skills.length} skill${course.skills.length === 1 ? '' : 's'}`;
  }

  if (Array.isArray(course.tags) && course.tags.length > 0) {
    return course.tags[0].replace(/[-_]/g, ' ');
  }

  return 'Guided course';
}

function getFeaturedInstructors(courses: Course[]) {
  const seen = new Set<string>();

  return courses
    .filter((course) => course.instructor)
    .map((course) => ({ instructor: course.instructor!, course }))
    .filter((entry) => {
      if (seen.has(entry.instructor.id)) return false;
      seen.add(entry.instructor.id);
      return true;
    })
    .slice(0, 3);
}

function stringOrDefault(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function stringOrNull(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null;
}

function getInitials(input: string) {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

