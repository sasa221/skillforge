'use client';

import Link from 'next/link';
import { BookUser, Film, ImageIcon, LibraryBig, UserRound } from 'lucide-react';

import { MediaVideoFrame } from '@/components/site/MediaVideoFrame';
import { resolveInstructorAvatarUrl, resolveMediaUrl } from '@/lib/content/media';
import type { AdminInstructor, AdminMediaAsset } from '@/lib/content/types';

type CourseLinkedAssetsPanelProps = {
  instructor: AdminInstructor | null;
  coverAsset: AdminMediaAsset | null;
  coverImageUrl?: string | null;
  introVideoAsset: AdminMediaAsset | null;
  introVideoUrl?: string | null;
  showManageLinks?: boolean;
};

export function CourseLinkedAssetsPanel({
  instructor,
  coverAsset,
  coverImageUrl,
  introVideoAsset,
  introVideoUrl,
  showManageLinks = true,
}: CourseLinkedAssetsPanelProps) {
  const coverUrl = resolveMediaUrl(coverAsset, coverImageUrl);
  const videoUrl = resolveMediaUrl(introVideoAsset, introVideoUrl);
  const instructorAvatarUrl = resolveInstructorAvatarUrl(instructor);

  return (
    <div className="space-y-5">
      <div className="rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <BookUser className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
                Linked content
              </div>
              <div className="mt-1 text-lg font-semibold text-[var(--site-text)]">
                Instructor and course media
              </div>
            </div>
          </div>
          {showManageLinks ? (
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <Link
                href="/admin/instructors"
                className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-2 text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
              >
                Manage instructors
              </Link>
              <Link
                href="/admin/media-assets"
                className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-2 text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
              >
                Manage media
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <PreviewCard
        icon={UserRound}
        title="Instructor preview"
        empty="Pick an instructor to preview how the teaching identity will appear on the course page."
      >
        {instructor ? (
          <div className="flex gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] text-base font-semibold text-primary">
              {instructorAvatarUrl ? (
                <img src={instructorAvatarUrl} alt={instructor.fullName} className="h-full w-full object-cover" />
              ) : (
                getInitials(instructor.fullName)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold text-[var(--site-text)]">{instructor.fullName}</div>
              <div className="mt-1 text-sm text-[var(--site-subtle)]">
                {instructor.title ?? 'Course instructor'}
              </div>
              <div className="mt-3 text-sm leading-7 text-[var(--site-muted)]">
                {instructor.bio ?? 'No instructor bio has been added yet.'}
              </div>
            </div>
          </div>
        ) : null}
      </PreviewCard>

      <PreviewCard
        icon={ImageIcon}
        title="Cover image preview"
        empty="Pick a media asset or paste a direct image URL to preview the course cover."
      >
        {coverUrl ? (
          <div className="overflow-hidden rounded-[1.3rem] border border-[var(--site-border)] bg-[var(--site-surface)]">
            <img
              src={coverUrl}
              alt={coverAsset?.altText ?? coverAsset?.title ?? 'Course cover preview'}
              className="h-52 w-full object-cover"
            />
          </div>
        ) : null}
      </PreviewCard>

      <PreviewCard
        icon={Film}
        title="Intro video preview"
        empty="Pick a video asset or paste a direct intro video URL to preview the course walkthrough."
      >
        {videoUrl ? (
          <MediaVideoFrame
            url={videoUrl}
            title={introVideoAsset?.title ?? 'Course intro video'}
            caption="This video appears inside the course experience when an intro is available."
          />
        ) : null}
      </PreviewCard>
    </div>
  );
}

function PreviewCard({
  icon: Icon,
  title,
  empty,
  children,
}: {
  icon: typeof LibraryBig;
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasContent = Boolean(children);

  return (
    <div className="rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 shadow-[0_18px_36px_var(--site-shadow)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-lg font-semibold text-[var(--site-text)]">{title}</div>
      </div>
      <div className="mt-4">
        {hasContent ? (
          children
        ) : (
          <div className="rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-4 text-sm leading-7 text-[var(--site-muted)]">
            {empty}
          </div>
        )}
      </div>
    </div>
  );
}

function getInitials(input: string) {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
