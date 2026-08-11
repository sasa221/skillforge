'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock3, Eye, FileClock, MessageSquareText, Sparkles } from 'lucide-react';

import { AdminMetricCard, AdminPageIntro, AdminStatusPill, AdminSurface } from '@/components/admin/AdminUi';
import { adminApi } from '@/lib/api/endpoints';
import type {
  AdminLesson,
  AdminModule,
  AdminReviewQueueItem,
  ContentReviewStatus,
  CourseDetail,
} from '@/lib/content/types';
import { resolveInstructorAvatarUrl } from '@/lib/content/media';

type ReviewFilterStatus = 'pending' | 'submitted' | 'changes_requested' | 'approved' | 'draft' | 'all';
type ReviewFilterType = 'all' | 'course' | 'module' | 'lesson';

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState<ReviewFilterStatus>('pending');
  const [type, setType] = React.useState<ReviewFilterType>('all');
  const [searchText, setSearchText] = React.useState('');

  const reviewQuery = useQuery({
    queryKey: ['admin', 'reviews', status, type],
    queryFn: () => adminApi.reviews(status, type),
  });

  const approve = useMutation({
    mutationFn: async (item: AdminReviewQueueItem) => {
      if (item.entityType === 'course') {
        return adminApi.courses.approveReview(item.id) as Promise<CourseDetail>;
      }
      if (item.entityType === 'module') {
        return adminApi.modules.approveReview(item.id) as Promise<AdminModule>;
      }
      return adminApi.lessons.approveReview(item.id) as Promise<AdminLesson>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    },
  });

  const requestChanges = useMutation({
    mutationFn: async (item: AdminReviewQueueItem) => {
      if (item.entityType === 'course') {
        return adminApi.courses.requestChanges(item.id) as Promise<CourseDetail>;
      }
      if (item.entityType === 'module') {
        return adminApi.modules.requestChanges(item.id) as Promise<AdminModule>;
      }
      return adminApi.lessons.requestChanges(item.id) as Promise<AdminLesson>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    },
  });

  const summary = reviewQuery.data?.summary;
  const filteredItems = (reviewQuery.data?.items ?? []).filter((item) => {
    const haystack = [
      item.title,
      item.slug ?? '',
      item.reviewNotes ?? '',
      item.course?.title ?? '',
      item.module?.title ?? '',
      item.instructor?.fullName ?? '',
      item.instructor?.title ?? '',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(searchText.toLowerCase());
  });

  return (
    <main className="space-y-6">
      <AdminPageIntro
        title="Review Queue"
        description="See every course, module, and lesson waiting for approval or revision in one place."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <FilterChip
              active={status === 'pending'}
              label={`Needs attention (${summary?.needsAttention ?? 0})`}
              onClick={() => setStatus('pending')}
            />
            <FilterChip
              active={status === 'submitted'}
              label={`Submitted (${summary?.submitted ?? 0})`}
              onClick={() => setStatus('submitted')}
            />
            <FilterChip
              active={status === 'changes_requested'}
              label={`Changes requested (${summary?.changesRequested ?? 0})`}
              onClick={() => setStatus('changes_requested')}
            />
          </div>
        }
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <AdminMetricCard
          title="Needs Attention"
          value={String(summary?.needsAttention ?? 0)}
          detail="Submitted + changes requested"
          icon={Clock3}
          tone="orange"
        />
        <AdminMetricCard
          title="Courses In Queue"
          value={String(summary?.byType.course ?? 0)}
          detail="Course-level reviews"
          icon={Sparkles}
          tone="blue"
        />
        <AdminMetricCard
          title="Modules In Queue"
          value={String(summary?.byType.module ?? 0)}
          detail="Module-level reviews"
          icon={FileClock}
          tone="violet"
        />
        <AdminMetricCard
          title="Lessons In Queue"
          value={String(summary?.byType.lesson ?? 0)}
          detail="Lesson-level reviews"
          icon={MessageSquareText}
          tone="emerald"
        />
      </section>

      <AdminSurface>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-4xl font-semibold text-[var(--site-text)]">Pending Review Items</h2>
            <p className="mt-2 text-lg text-[var(--site-muted)]">
              Showing {filteredItems.length} item{filteredItems.length === 1 ? '' : 's'} in the current review view.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2">
              <FilterChip active={type === 'all'} label="All types" onClick={() => setType('all')} />
              <FilterChip active={type === 'course'} label="Courses" onClick={() => setType('course')} />
              <FilterChip active={type === 'module'} label="Modules" onClick={() => setType('module')} />
              <FilterChip active={type === 'lesson'} label="Lessons" onClick={() => setType('lesson')} />
            </div>
            <div className="flex h-12 min-w-[300px] items-center rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4">
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search title, instructor, notes, or parent course..."
                className="w-full bg-transparent text-sm text-[var(--site-text)] outline-none placeholder:text-[var(--site-subtle)]"
              />
            </div>
          </div>
        </div>

        {reviewQuery.isLoading ? (
          <div className="mt-6 text-lg text-[var(--site-muted)]">Loading review queue...</div>
        ) : reviewQuery.isError ? (
          <div className="mt-6 rounded-[1.2rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
            {reviewQuery.error instanceof Error ? reviewQuery.error.message : 'Failed to load review queue'}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-6 text-lg text-[var(--site-muted)]">
            No review items match the current filters.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredItems.map((item) => {
              const isBusy =
                (approve.isPending && approve.variables?.id === item.id) ||
                (requestChanges.isPending && requestChanges.variables?.id === item.id);

              return (
                <div
                  key={`${item.entityType}-${item.id}`}
                  className="rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <AdminStatusPill tone={reviewTone(item.reviewStatus)}>
                          {reviewLabel(item.reviewStatus)}
                        </AdminStatusPill>
                        <AdminStatusPill tone="slate">{item.entityType.toUpperCase()}</AdminStatusPill>
                        <AdminStatusPill tone={statusTone(item.status)}>{item.status.toUpperCase()}</AdminStatusPill>
                      </div>

                      <div className="mt-4 flex items-start gap-4">
                        {item.instructor ? (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] text-sm font-semibold text-[var(--site-primary)]">
                            {resolveInstructorAvatarUrl(item.instructor) ? (
                              <img
                                src={resolveInstructorAvatarUrl(item.instructor)!}
                                alt={item.instructor.fullName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              getInitials(item.instructor.fullName)
                            )}
                          </div>
                        ) : null}

                        <div className="min-w-0 flex-1">
                          <div className="text-3xl font-semibold text-[var(--site-text)]">{item.title}</div>
                          <div className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--site-muted)]">
                            {item.instructor ? <span>Instructor: {item.instructor.fullName}</span> : null}
                            {item.course ? <span>Course: {item.course.title}</span> : null}
                            {item.module ? <span>Module: {item.module.title}</span> : null}
                            {item.slug ? <span>Slug: {item.slug}</span> : null}
                            <span>Updated: {formatDate(item.updatedAt)}</span>
                          </div>
                          {item.reviewNotes ? (
                            <div className="mt-4 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm leading-7 text-[var(--site-text)]">
                              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--site-subtle)]">
                                Review note
                              </div>
                              {item.reviewNotes}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                      <Link
                        href={item.editHref}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
                      >
                        <Eye className="h-4 w-4" />
                        Open editor
                      </Link>
                      <button
                        type="button"
                        onClick={() => approve.mutate(item)}
                        disabled={isBusy || item.reviewStatus === 'approved'}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {approve.isPending && approve.variables?.id === item.id ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => requestChanges.mutate(item)}
                        disabled={isBusy || item.reviewStatus === 'changes_requested'}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] border border-violet-500/20 bg-violet-500/10 px-4 text-sm font-semibold text-violet-700 transition hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <MessageSquareText className="h-4 w-4" />
                        {requestChanges.isPending && requestChanges.variables?.id === item.id
                          ? 'Sending...'
                          : 'Request changes'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminSurface>
    </main>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'inline-flex h-11 items-center justify-center rounded-full border border-primary/20 bg-primary/10 px-4 text-sm font-semibold text-primary'
          : 'inline-flex h-11 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-sm font-semibold text-[var(--site-muted)] transition hover:bg-[var(--site-primary-soft)] hover:text-[var(--site-text)]'
      }
    >
      {label}
    </button>
  );
}

function reviewTone(status: ContentReviewStatus) {
  if (status === 'approved') return 'emerald' as const;
  if (status === 'submitted') return 'blue' as const;
  if (status === 'changes_requested') return 'violet' as const;
  return 'orange' as const;
}

function reviewLabel(status: ContentReviewStatus) {
  if (status === 'changes_requested') return 'CHANGES REQUESTED';
  return status.replace('_', ' ').toUpperCase();
}

function statusTone(status: string) {
  if (status === 'published') return 'emerald' as const;
  if (status === 'archived') return 'slate' as const;
  return 'orange' as const;
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
