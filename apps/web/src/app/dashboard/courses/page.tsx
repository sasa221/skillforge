'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  BellRing,
  BookOpenText,
  Bot,
  Clock3,
  Filter,
  Flame,
  Search,
  Sparkles,
  Target,
} from 'lucide-react';

import { CourseArtwork } from '@/components/site/CourseArtwork';
import { CourseInstructorIdentity } from '@/components/site/CourseInstructorIdentity';
import { CourseInstructorSpotlight } from '@/components/site/CourseInstructorSpotlight';
import { useToast } from '@/components/toast/toast-provider';
import { coursesApi, enrollmentsApi, progressApi } from '@/lib/api/endpoints';
import { resolveCourseCoverUrl } from '@/lib/content/media';
import { headingFont } from '@/lib/fonts';
import type { Course, CourseProgress, Enrollment } from '@/lib/content/types';
import { cn } from '@/lib/utils';

type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

type CatalogItem = {
  course: Course | Enrollment['course'];
  enrollment: Enrollment | null;
  progress: CourseProgress | null;
};

export default function DashboardCoursesPage() {
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const deferredSearch = useDeferredValue(search);

  const catalogQuery = useQuery({
    queryKey: ['courses', 'published'],
    queryFn: coursesApi.list,
  });

  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments', 'me'],
    queryFn: enrollmentsApi.me,
  });

  const dashboardQuery = useQuery({
    queryKey: ['progress', 'dashboard'],
    queryFn: progressApi.dashboard,
  });

  const progressQueries = useQueries({
    queries: (enrollmentsQuery.data ?? []).map((enrollment) => ({
      queryKey: ['progress', 'course', enrollment.course.id],
      queryFn: () => progressApi.course(enrollment.course.id),
      staleTime: 15_000,
    })),
  });

  const progressByCourseId = new Map<string, CourseProgress>();
  (enrollmentsQuery.data ?? []).forEach((enrollment, index) => {
    const result = progressQueries[index];
    if (result?.data) {
      progressByCourseId.set(enrollment.course.id, result.data);
    }
  });

  const catalogItems = useMemo(
    () => buildCatalogItems(catalogQuery.data ?? [], enrollmentsQuery.data ?? [], progressByCourseId),
    [catalogQuery.data, enrollmentsQuery.data, progressQueries],
  );

  const skillFilters = useMemo(
    () =>
      Array.from(
        new Set(
          catalogItems.flatMap((item) => item.course.skills.map((skill) => skill.skill.title)),
        ),
      ),
    [catalogItems],
  );

  const featuredCourse =
    catalogItems.find(
      (item) => item.course.slug === dashboardQuery.data?.continueLesson?.courseSlug,
    ) ??
    catalogItems.find((item) => item.enrollment) ??
    catalogItems[0] ??
    null;

  const visibleCourses = useMemo(
    () =>
      catalogItems.filter((item) => {
        const haystack = [
          item.course.title,
          item.course.description ?? '',
          item.course.tags.join(' '),
          item.course.skills.map((skill) => skill.skill.title).join(' '),
        ]
          .join(' ')
          .toLowerCase();

        const matchesSearch =
          deferredSearch.trim().length === 0 ||
          haystack.includes(deferredSearch.trim().toLowerCase());

        const matchesSkill =
          selectedSkill === 'all' ||
          item.course.skills.some((skill) => skill.skill.title === selectedSkill);

        const matchesDifficulty =
          difficulty === 'all' || item.course.difficulty === difficulty;

        return matchesSearch && matchesSkill && matchesDifficulty;
      }),
    [catalogItems, deferredSearch, difficulty, selectedSkill],
  );

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_22px_48px_var(--site-shadow)] lg:p-8">
          {catalogQuery.isLoading ? (
            <div className="space-y-4">
              <div className="h-8 w-40 rounded-full bg-[var(--site-surface-alt)]" />
              <div className="h-16 w-2/3 rounded-[1.6rem] bg-[var(--site-surface-alt)]" />
              <div className="h-6 w-full rounded-full bg-[var(--site-surface-alt)]" />
            </div>
          ) : featuredCourse ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary-soft)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--site-primary)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {featuredCourse.enrollment ? 'Continue learning' : 'Featured course'}
                </div>

                <div className="space-y-4">
                  <h1
                    className={cn(
                      'max-w-[720px] text-5xl font-extrabold leading-[0.96] tracking-[-0.05em] text-[var(--site-text)]',
                      headingFont.className,
                    )}
                  >
                    {featuredCourse.course.title}
                  </h1>
                  <p className="max-w-[720px] text-lg leading-8 text-[var(--site-muted)]">
                    {featuredCourse.course.description ??
                      'Continue with a clearer course overview, visible progress tracking, and a focused path back into the next lesson.'}
                  </p>
                  <CourseInstructorSpotlight
                    instructor={featuredCourse.course.instructor}
                    compact
                    className="max-w-[540px]"
                    eyebrow={featuredCourse.enrollment ? 'Current course guide' : 'Featured instructor'}
                    title={
                      featuredCourse.enrollment
                        ? 'Study with your instructor'
                        : 'Meet the instructor behind this course'
                    }
                    description={
                      featuredCourse.course.instructor?.bio ??
                      `This instructor guides the examples, pacing, and checkpoints inside ${featuredCourse.course.title}.`
                    }
                    ctaHref={
                      featuredCourse.course.instructor
                        ? `/instructors/${featuredCourse.course.instructor.slug}`
                        : undefined
                    }
                    ctaLabel={featuredCourse.course.instructor ? 'View instructor profile' : undefined}
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <CoursePrimaryAction
                    item={featuredCourse}
                    continueLessonSlug={
                      dashboardQuery.data?.continueLesson?.courseSlug === featuredCourse.course.slug
                        ? dashboardQuery.data?.continueLesson?.slug
                        : null
                    }
                    size="lg"
                  />
                  <Link
                    href={`/dashboard/courses/${featuredCourse.course.slug}`}
                    className="inline-flex items-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-6 py-3.5 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-alt)]"
                  >
                    Open course overview
                  </Link>
                </div>
              </div>

              <div className="space-y-4 rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
                  <Bot className="h-7 w-7" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--site-subtle)]">
                    AI study support
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-[var(--site-text)]">
                    {formatXp(estimateXp(featuredCourse.course))}
                  </div>
                  <div className="mt-1 text-sm text-[var(--site-subtle)]">Completion reward</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
                    <span>Current progress</span>
                    <span>{featuredCourse.progress?.percent ?? 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--site-border)]">
                    <div
                      className="h-2 rounded-full bg-[var(--site-primary)]"
                      style={{ width: `${featuredCourse.progress?.percent ?? 0}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-[1.35rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm leading-7 text-[var(--site-muted)]">
                  Keep course rewards, progress, and your next study move visible while you work through the roadmap.
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.6rem] border border-dashed border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5 text-sm text-[var(--site-subtle)]">
              No courses are available in your library yet.
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_22px_48px_var(--site-shadow)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-warm-soft)] text-[var(--site-warm)]">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
                <div className="text-xl font-bold text-[var(--site-text)]">Learning tools</div>
                <div className="text-sm text-[var(--site-subtle)]">Helpful shortcuts around your course space</div>
              </div>
            </div>
            <div className="grid gap-3">
              <StatusPill label="Topic filters" value="Refine by skill or level" />
              <StatusPill label="Course milestones" value="Track lessons, modules, and rewards" />
              <StatusPill label="Community" value="Mentor help and peer discussion" />
            </div>
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)]"
          >
            Open community hub
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-[430px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--site-subtle)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search skills, tags, or course titles..."
              className="h-14 w-full rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] pl-11 pr-4 text-sm text-[var(--site-text)] outline-none transition placeholder:text-[var(--site-subtle)] focus:border-[var(--site-primary)] focus:shadow-[0_0_0_4px_var(--site-primary-soft)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <FilterChip active={selectedSkill === 'all'} onClick={() => setSelectedSkill('all')} icon={Filter}>
              All Topics
            </FilterChip>
            {skillFilters.slice(0, 4).map((skill) => (
              <FilterChip
                key={skill}
                active={selectedSkill === skill}
                onClick={() => setSelectedSkill(skill)}
              >
                {skill}
              </FilterChip>
            ))}

            <label className="inline-flex h-12 items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 text-sm font-medium text-[var(--site-muted)]">
              <Target className="h-4 w-4 text-[var(--site-subtle)]" />
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as DifficultyFilter)}
                className="bg-transparent outline-none"
              >
                <option value="all">All levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
          </div>
        </div>

        {catalogQuery.isError || enrollmentsQuery.isError ? (
          <div className="rounded-[1.7rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
            {catalogQuery.error instanceof Error
              ? catalogQuery.error.message
              : enrollmentsQuery.error instanceof Error
                ? enrollmentsQuery.error.message
                : 'Could not load your library'}
          </div>
        ) : catalogQuery.isLoading || enrollmentsQuery.isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[430px] rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
            ))}
          </div>
        ) : visibleCourses.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-[var(--site-border)] bg-[var(--site-surface)] p-10 text-center">
            <div className="text-2xl font-bold text-[var(--site-text)]">No courses match these filters</div>
            <p className="mt-3 text-sm leading-7 text-[var(--site-subtle)]">
              Try a wider search or clear the skill filter to see more of your library.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleCourses.map((item, index) => (
                <CourseCard
                  key={item.course.id}
                  item={item}
                  index={index}
                  continueLessonSlug={
                    dashboardQuery.data?.continueLesson?.courseSlug === item.course.slug
                      ? dashboardQuery.data?.continueLesson?.slug
                      : null
                  }
                />
              ))}
            </div>

            <div className="rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-6 py-5 text-sm text-[var(--site-subtle)] shadow-[0_18px_40px_var(--site-shadow)]">
              Showing {visibleCourses.length} of {catalogItems.length} courses in your library.
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function CourseCard({
  item,
  index,
  continueLessonSlug,
}: {
  item: CatalogItem;
  index: number;
  continueLessonSlug: string | null;
}) {
  const progressPercent = item.progress?.percent ?? 0;
  const lessonCount = getLessonCount(item);

  return (
    <div className="overflow-hidden rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface)] shadow-[0_22px_44px_var(--site-shadow)]">
      <CourseArtwork
        index={index}
        label={item.course.difficulty}
        imageUrl={resolveCourseCoverUrl(item.course)}
        imageAlt={item.course.title}
        className="h-[220px] rounded-none rounded-t-[1.9rem]"
      />

      <div className="space-y-5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {item.course.skills.slice(0, 2).map((skill) => (
              <span
                key={skill.id}
                className="rounded-full bg-[var(--site-primary-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-primary)]"
              >
                {skill.skill.title}
              </span>
            ))}
          </div>
          {item.enrollment ? (
            <span className="rounded-full bg-[var(--site-success-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-success)]">
              Enrolled
            </span>
          ) : null}
        </div>

        <div>
          <h2 className="text-[1.8rem] font-bold leading-tight text-[var(--site-text)]">{item.course.title}</h2>
          <CourseInstructorIdentity instructor={item.course.instructor} className="mt-3" />
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--site-subtle)]">
            {item.course.description ??
              'A focused course entry with progress, lessons, and roadmap details in one place.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--site-muted)]">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-4 w-4 text-[var(--site-subtle)]" />
            {formatDuration(item.course.estimatedMinutes)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Flame className="h-4 w-4 text-[var(--site-warm)]" />
            {formatXp(estimateXp(item.course))}
          </span>
          {lessonCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <BookOpenText className="h-4 w-4 text-[var(--site-subtle)]" />
              {lessonCount} lessons
            </span>
          ) : null}
        </div>

        <div>
          <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-[var(--site-border)]">
            <div
              className="h-2 rounded-full bg-[var(--site-primary)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--site-border)] pt-4">
          <div className="inline-flex items-center gap-2 text-sm text-[var(--site-muted)]">
            <BookOpenText className="h-4 w-4 text-[var(--site-subtle)]" />
            {item.enrollment
              ? `${Math.min(item.progress?.completedLessons ?? 0, lessonCount)} of ${lessonCount} lessons completed`
              : `${item.course.skills.length} skill area${item.course.skills.length === 1 ? '' : 's'}`}
          </div>
          <CoursePrimaryAction item={item} continueLessonSlug={continueLessonSlug} />
        </div>
      </div>
    </div>
  );
}

function CoursePrimaryAction({
  item,
  continueLessonSlug,
  size = 'default',
}: {
  item: CatalogItem;
  continueLessonSlug: string | null;
  size?: 'default' | 'lg';
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const enrollMutation = useMutation({
    mutationFn: () => enrollmentsApi.enroll(item.course.id),
    onSuccess: async (enrollment) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['enrollments', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['progress', 'dashboard'] }),
      ]);
      toast({
        title: 'Enrolled successfully',
        description: 'Opening your course overview.',
      });
      router.push(`/dashboard/courses/${enrollment.course.slug}`);
    },
    onError: (error) => {
      toast({
        title: 'Enrollment failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const href = resolveCourseHref(item, continueLessonSlug);
  const label = resolvePrimaryLabel(item, continueLessonSlug);

  if (item.enrollment) {
    return (
      <Link
        href={href}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-full bg-[var(--site-text)] text-sm font-semibold text-white transition hover:bg-[var(--site-primary)]',
          size === 'lg' ? 'px-6 py-3.5' : 'px-4 py-2.5',
        )}
      >
        {label}
        <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => enrollMutation.mutate()}
      disabled={enrollMutation.isPending}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full bg-[var(--site-primary)] text-sm font-semibold text-white transition hover:bg-[var(--site-primary-strong)] disabled:opacity-70',
        size === 'lg' ? 'px-6 py-3.5' : 'px-4 py-2.5',
      )}
    >
      {enrollMutation.isPending ? 'Enrolling...' : 'Enroll now'}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

function FilterChip({
  active,
  children,
  onClick,
  icon: Icon,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  icon?: typeof Filter;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-12 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition',
        active
          ? 'border-[var(--site-primary)] bg-[var(--site-primary)] text-white shadow-[0_16px_28px_var(--site-shadow)]'
          : 'border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-text)] hover:bg-[var(--site-surface-alt)]',
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3">
      <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--site-subtle)]">{label}</div>
      <div className="mt-1 text-sm font-semibold text-[var(--site-text)]">{value}</div>
    </div>
  );
}

function buildCatalogItems(
  catalog: Course[],
  enrollments: Enrollment[],
  progressByCourseId: Map<string, CourseProgress>,
): CatalogItem[] {
  const map = new Map<string, CatalogItem>();

  catalog.forEach((course) => {
    map.set(course.id, {
      course,
      enrollment: null,
      progress: null,
    });
  });

  enrollments.forEach((enrollment) => {
    map.set(enrollment.course.id, {
      course: enrollment.course,
      enrollment,
      progress: progressByCourseId.get(enrollment.course.id) ?? null,
    });
  });

  return Array.from(map.values()).sort((left, right) => {
    const leftOrder = left.course.order ?? 0;
    const rightOrder = right.course.order ?? 0;
    return leftOrder - rightOrder;
  });
}

function resolveCourseHref(item: CatalogItem, continueLessonSlug: string | null): string {
  if (continueLessonSlug) {
    return `/dashboard/lessons/${continueLessonSlug}`;
  }

  const firstLesson = item.enrollment?.course.modules[0]?.lessons[0]?.slug ?? null;

  if (firstLesson && (item.progress?.percent ?? 0) === 0) {
    return `/dashboard/lessons/${firstLesson}`;
  }

  return item.enrollment ? `/dashboard/courses/${item.course.slug}` : `/courses/${item.course.slug}`;
}

function resolvePrimaryLabel(item: CatalogItem, continueLessonSlug: string | null): string {
  if (!item.enrollment) return 'Enroll';
  if (continueLessonSlug) return 'Continue';
  if ((item.progress?.percent ?? 0) > 0) return 'Open course';
  return 'Start course';
}

function getLessonCount(item: CatalogItem): number {
  if (!item.enrollment) return 0;
  return item.enrollment.course.modules.reduce((count, module) => count + module.lessons.length, 0);
}

function estimateXp(course: Course | Enrollment['course']): number {
  if (course.estimatedMinutes && course.estimatedMinutes > 0) {
    return course.estimatedMinutes * 60;
  }

  if ('modules' in course) {
    const lessons = course.modules.reduce((count, module) => count + module.lessons.length, 0);
    if (lessons > 0) return lessons * 600;
  }

  return 1200;
}

function formatXp(value: number): string {
  return `${value.toLocaleString()} XP`;
}

function formatDuration(minutes: number | null): string {
  if (!minutes || minutes <= 0) return 'Self paced';
  if (minutes < 60) return `${minutes} mins`;

  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours} hours`;
  return `${hours.toFixed(1)} hours`;
}
