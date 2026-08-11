'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpenText, Plus, Search } from 'lucide-react';

import {
  AdminPageIntro,
  AdminStatusPill,
  AdminSurface,
} from '@/components/admin/AdminUi';
import { adminApi } from '@/lib/api/endpoints';
import { cn } from '@/lib/utils';

const statusFilters = ['all', 'published', 'draft', 'archived'] as const;
const courseGridClass =
  'grid grid-cols-[360px_180px_170px_220px_170px] items-center gap-6';

export default function AdminCoursesPage() {
  const qc = useQueryClient();
  const [selectedStatus, setSelectedStatus] =
    React.useState<(typeof statusFilters)[number]>('all');
  const [searchText, setSearchText] = React.useState('');

  const coursesQuery = useQuery({
    queryKey: ['admin', 'courses'],
    queryFn: adminApi.courses.list,
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.courses.remove(id),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['admin', 'courses'] }),
  });

  if (coursesQuery.isLoading) {
    return (
      <main className="space-y-6">
        <div className="h-24 rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
        <div className="h-[44rem] rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
      </main>
    );
  }

  if (coursesQuery.isError) {
    return (
      <main className="rounded-[1.8rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
        <div className="font-semibold">Could not load courses</div>
        <div className="mt-2 text-[var(--site-danger)]/80">
          {coursesQuery.error instanceof Error ? coursesQuery.error.message : 'Unknown error'}
        </div>
      </main>
    );
  }

  const courses = coursesQuery.data ?? [];
  const filteredCourses = courses.filter((course) => {
    const statusMatch = selectedStatus === 'all' ? true : course.status === selectedStatus;
    const searchMatch = `${course.title} ${course.slug} ${course.description ?? ''}`
      .toLowerCase()
      .includes(searchText.toLowerCase());
    return statusMatch && searchMatch;
  });

  return (
    <main className="space-y-6">
      <AdminPageIntro
        title="Manage Courses"
        description="Organize course structure, publishing states, and curriculum assets."
        actions={
          <Link
            href="/admin/courses/new"
            className="inline-flex h-16 items-center justify-center gap-2 rounded-[1.2rem] bg-primary px-6 text-xl font-semibold text-primary-foreground shadow-[0_18px_34px_rgba(249,115,22,0.24)] transition hover:bg-primary/90"
          >
            <Plus className="h-5 w-5" />
            Create New Course
          </Link>
        }
      />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-3">
          {statusFilters.map((filter) => {
            const active = selectedStatus === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedStatus(filter)}
                className={cn(
                  'inline-flex h-14 items-center justify-center rounded-[1.1rem] border px-5 text-lg font-semibold transition',
                  active
                    ? 'border-primary/20 bg-primary text-primary-foreground'
                    : 'border-[var(--site-border)] bg-[var(--site-surface-alt)] text-[var(--site-muted)] hover:bg-[var(--site-primary-soft)] hover:text-[var(--site-text)]',
                )}
              >
                {filter === 'all' ? 'All Courses' : capitalize(filter)}
              </button>
            );
          })}
        </div>

        <div className="flex h-14 items-center gap-3 rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4">
          <Search className="h-5 w-5 text-[var(--site-subtle)]" />
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Filter courses, slugs or descriptions..."
            className="w-80 bg-transparent text-base text-[var(--site-text)] outline-none placeholder:text-[var(--site-subtle)]"
          />
        </div>
      </div>

      <AdminSurface className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[1160px]">
            <div
              className={cn(
                courseGridClass,
                'bg-[var(--site-surface-alt)] px-8 py-6 text-[0.92rem] font-semibold uppercase tracking-[0.22em] text-[var(--site-subtle)]',
              )}
            >
              <div>Course</div>
              <div>Status</div>
              <div>Difficulty</div>
              <div>Modules / Lessons</div>
              <div className="text-right">Actions</div>
            </div>

            <div className="divide-y divide-[var(--site-border)]">
              {filteredCourses.length === 0 ? (
                <div className="px-8 py-10 text-lg text-[var(--site-muted)]">
                  No courses match the current filters.
                </div>
              ) : (
                filteredCourses.map((course) => (
                  <div key={course.id} className={cn(courseGridClass, 'px-8 py-8')}>
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                          <BookOpenText className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="break-words text-[1.6rem] font-semibold leading-[1.12] text-[var(--site-text)]">
                            {course.title}
                          </div>
                          <div className="mt-3 inline-flex max-w-[15.5rem] whitespace-normal break-all rounded-[0.8rem] border border-primary/15 bg-primary/10 px-3 py-2 font-mono text-[0.98rem] leading-6 text-primary">
                            {course.slug}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <AdminStatusPill tone={statusTone(course.status)}>
                        {course.status.toUpperCase()}
                      </AdminStatusPill>
                    </div>

                    <div className="min-w-0">
                      <AdminStatusPill tone={difficultyTone(course.difficulty)}>
                        {capitalize(course.difficulty)}
                      </AdminStatusPill>
                    </div>

                    <div className="text-[1.32rem] leading-8 text-[var(--site-muted)]">
                      {course.moduleCount} modules / {course.lessonCount} lessons
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/courses/${course.id}/edit`}
                        className="inline-flex h-11 items-center justify-center rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 text-base font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove.mutate(course.id)}
                        disabled={remove.isPending}
                        className="inline-flex h-11 items-center justify-center rounded-[1rem] border border-primary/15 bg-primary/10 px-5 text-base font-semibold text-primary transition hover:bg-primary/15 disabled:opacity-60"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--site-border)] px-8 py-5 text-lg text-[var(--site-muted)]">
          Showing {filteredCourses.length} of {courses.length} courses
        </div>
      </AdminSurface>

      {remove.isError ? (
        <div className="rounded-[1.2rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
          {remove.error instanceof Error ? remove.error.message : 'Delete failed'}
        </div>
      ) : null}
    </main>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function statusTone(status: string) {
  if (status === 'published') return 'emerald' as const;
  if (status === 'archived') return 'slate' as const;
  return 'orange' as const;
}

function difficultyTone(difficulty: string) {
  if (difficulty === 'advanced') return 'violet' as const;
  if (difficulty === 'intermediate') return 'orange' as const;
  return 'blue' as const;
}
