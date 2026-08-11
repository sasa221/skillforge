'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Clock3,
  Filter,
  Search,
  SlidersHorizontal,
  Star,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { CourseArtwork } from '@/components/site/CourseArtwork';
import { CourseInstructorIdentity } from '@/components/site/CourseInstructorIdentity';
import { InstructorPathMini } from '@/components/site/InstructorPathMini';
import { CourseInstructorSpotlight } from '@/components/site/CourseInstructorSpotlight';
import { PublicShell } from '@/components/site/PublicShell';
import { coursesApi } from '@/lib/api/endpoints';
import { resolveCourseCoverUrl } from '@/lib/content/media';
import { headingFont } from '@/lib/fonts';
import type { Course } from '@/lib/content/types';
import { cn } from '@/lib/utils';

type SortMode = 'featured' | 'duration' | 'difficulty';

export function CoursesCatalogClient({ initialCourses }: { initialCourses: Course[] }) {
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const query = useQuery({
    queryKey: ['courses', 'published'],
    queryFn: coursesApi.list,
    initialData: initialCourses,
  });

  const topics = useMemo(() => {
    const source = query.data ?? [];
    return Array.from(
      new Set(
        source.flatMap((course) => course.skills.map((skill) => skill.skill.title)),
      ),
    );
  }, [query.data]);

  const filteredCourses = useMemo(() => {
    const list = [...(query.data ?? [])].filter((course) => {
      const text = [
        course.title,
        course.description ?? '',
        course.tags.join(' '),
        course.skills.map((skill) => skill.skill.title).join(' '),
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        deferredSearch.trim().length === 0 ||
        text.includes(deferredSearch.trim().toLowerCase());

      const matchesTopic =
        selectedTopic === 'all' ||
        course.skills.some((skill) => skill.skill.title === selectedTopic);

      const matchesDifficulty =
        difficultyFilter === 'all' ||
        course.difficulty === difficultyFilter;

      return matchesSearch && matchesTopic && matchesDifficulty;
    });

    return list;
  }, [deferredSearch, query.data, selectedTopic, difficultyFilter]);

  const pageSize = 12;
  const totalPages = Math.ceil(filteredCourses.length / pageSize);
  const pagedCourses = filteredCourses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const featuredInstructors = useMemo(() => {
    const seen = new Set<string>();

    return (query.data ?? [])
      .filter((course) => course.instructor)
      .map((course) => ({ instructor: course.instructor!, course }))
      .filter((entry) => {
        if (seen.has(entry.instructor.id)) return false;
        seen.add(entry.instructor.id);
        return true;
      })
      .slice(0, 2);
  }, [query.data]);

  return (
    <PublicShell>
      <main className="bg-[radial-gradient(circle_at_top,var(--site-primary-soft),transparent_26%),linear-gradient(180deg,var(--site-bg-soft)_0%,var(--site-bg)_54%,var(--site-bg-soft)_100%)]">
        <section className="mx-auto w-full max-w-[1180px] px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="space-y-8">
            <div className="max-w-[760px] space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary-soft)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.24em] text-[var(--site-primary)]">
                Explore the course library
              </div>
              <h1 className={cn('text-5xl font-extrabold leading-[0.98] tracking-[-0.05em] text-[var(--site-text)] sm:text-6xl', headingFont.className)}>
                What will you{' '}
                <span className="bg-[linear-gradient(180deg,var(--site-primary)_0%,#7ec9ff_100%)] bg-clip-text text-transparent">
                  forge
                </span>{' '}
                today?
              </h1>
              <p className="max-w-[720px] text-lg leading-8 text-[var(--site-muted)]">
                Explore focused courses by topic, difficulty, and study time, then jump into the one
                that best fits your next goal.
              </p>
            </div>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-[420px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--site-subtle)]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search skills, tags, or course titles..."
                  className="h-14 w-full rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] pl-11 pr-4 text-sm text-[var(--site-text)] outline-none transition placeholder:text-[var(--site-subtle)] focus:border-[var(--site-primary)] focus:shadow-[0_0_0_4px_var(--site-primary-soft)]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <TopicChip
                  active={selectedTopic === 'all'}
                  onClick={() => setSelectedTopic('all')}
                  icon={Filter}
                >
                  All Topics
                </TopicChip>

                {topics.slice(0, 4).map((topic) => (
                  <TopicChip
                    key={topic}
                    active={selectedTopic === topic}
                    onClick={() => setSelectedTopic(topic)}
                  >
                    {topic}
                  </TopicChip>
                ))}

                <label className="inline-flex h-12 items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-4 text-sm font-medium text-[var(--site-muted)]">
                  <SlidersHorizontal className="h-4 w-4 text-[var(--site-subtle)]" />
                  <select
                    value={difficultyFilter}
                    onChange={(event) => {
                      setDifficultyFilter(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent outline-none"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-5 py-4 text-sm text-[var(--site-muted)] shadow-[0_14px_28px_var(--site-shadow)]">
              Showing {filteredCourses.length} course{filteredCourses.length === 1 ? '' : 's'} across{' '}
              {topics.length || 1} skill area{topics.length === 1 ? '' : 's'}.
            </div>

            {featuredInstructors.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {featuredInstructors.map((entry) => (
                  <div key={entry.instructor.id} className="space-y-4">
                    <CourseInstructorSpotlight
                      instructor={entry.instructor}
                      compact
                      eyebrow="Featured instructor"
                      title={`Currently teaching ${entry.course.title}`}
                      description={
                        entry.instructor.bio ??
                        `${entry.instructor.fullName} is currently leading examples and checkpoints inside ${entry.course.title}.`
                      }
                      ctaHref={`/instructors/${entry.instructor.slug}`}
                      ctaLabel="View profile"
                    />
                    <InstructorPathMini
                      courses={(query.data ?? []).filter((course) => course.instructor?.id === entry.instructor.id)}
                      anchorCourse={entry.course}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1180px] px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20">
          {query.isError ? (
            <div className="rounded-[1.7rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
              {query.error instanceof Error ? query.error.message : 'Could not load courses'}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="rounded-[1.8rem] border border-dashed border-[var(--site-border)] bg-[var(--site-surface)]/70 p-10 text-center">
              <div className="text-2xl font-bold text-[var(--site-text)]">No courses match these filters</div>
              <p className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
                Try clearing the search or switching topics to see more of the catalog.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {pagedCourses.map((course, index) => (
                  <CourseCard key={course.id} course={course} index={index} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center gap-4">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium text-[var(--site-muted)]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}

              <div className="mt-12 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,var(--site-primary)_0%,#3ca8ff_46%,#4ab5ff_100%)] px-6 py-8 text-white shadow-[0_28px_56px_var(--site-shadow)] md:px-10 md:py-10">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-[620px]">
                    <h2 className={cn('text-4xl font-extrabold tracking-[-0.04em]', headingFont.className)}>
                      Start learning with guided courses
                    </h2>
                    <p className="mt-3 text-lg leading-8 text-white/88">
                      Start your first course today and learn through guided modules, checkpoints, and
                      practical lessons you can actually finish.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/signup"
                      className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[var(--site-primary)] transition hover:bg-[var(--site-surface-alt)]"
                    >
                      Start Free Trial
                    </Link>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      See Pricing
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </PublicShell>
  );
}

function TopicChip({
  active,
  onClick,
  children,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
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

function CourseCard({ course, index }: { course: Course; index: number }) {
  const lessonEstimate = course.estimatedMinutes ? Math.max(4, Math.round(course.estimatedMinutes / 12)) : 8;
  const lessonCount = (course as any).modules?.reduce((acc: number, mod: any) => acc + (mod._count?.lessons ?? 0), 0) || lessonEstimate;
  const enrollmentsCount = (course as any)._count?.enrollments ?? 0;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group overflow-hidden rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface)] shadow-[0_22px_44px_var(--site-shadow)] transition hover:-translate-y-1 hover:shadow-[0_30px_56px_var(--site-shadow)]"
    >
      <CourseArtwork
        index={index}
        label={course.difficulty}
        imageUrl={resolveCourseCoverUrl(course)}
        imageAlt={course.title}
        className="h-[230px] rounded-none rounded-t-[1.9rem]"
      />

      <div className="space-y-5 p-5">
        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--site-muted)]">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-4 w-4" />
            {course.estimatedMinutes ? `${Math.max(1, Math.round(course.estimatedMinutes / 60))} hours` : 'Self paced'}
          </span>
          <span>{lessonCount} lessons</span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-4 w-4" />
            {enrollmentsCount} enrolled
          </span>
          <span className={cn('px-2 py-0.5 text-xs font-bold rounded uppercase tracking-wider', 
            course.difficulty === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            course.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          )}>
            {course.difficulty}
          </span>
        </div>

        <div>
          <h2 className="text-[1.85rem] font-bold leading-tight text-[var(--site-text)]">{course.title}</h2>
          {course.instructor ? (<CourseInstructorIdentity instructor={course.instructor} className="mt-3" />) : null}
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--site-muted)]">
            {course.description ?? 'A structured path designed to build confidence through practical lessons and clear steps.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {course.skills.slice(0, 3).map((skill) => (
            <span
              key={skill.id}
              className="rounded-full bg-[var(--site-primary-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-primary)]"
            >
              {skill.skill.title}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--site-border)] pt-4">
          <div className="inline-flex items-center gap-2 text-sm text-[var(--site-muted)]">
            <Star className="h-4 w-4 fill-[#f7b548] text-[#f7b548]" />
            {course.skills.length} skill{course.skills.length === 1 ? '' : 's'} covered
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)]">
            View Course
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function difficultyWeight(difficulty: Course['difficulty']): number {
  if (difficulty === 'beginner') return 0;
  if (difficulty === 'intermediate') return 1;
  return 2;
}

