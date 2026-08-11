'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpenText, Plus, Save } from 'lucide-react';

import {
  AdminField,
  adminInputClassName,
  adminTextareaClassName,
} from '@/components/admin/AdminForms';
import { AdminMediaAssetPicker } from '@/components/admin/AdminMediaAssetPicker';
import { ContentRevisionPanel } from '@/components/admin/ContentRevisionPanel';
import { ContentReviewWorkflowPanel } from '@/components/admin/ContentReviewWorkflowPanel';
import { AdminPageIntro, AdminStatusPill, AdminSurface } from '@/components/admin/AdminUi';
import { MediaVideoFrame } from '@/components/site/MediaVideoFrame';
import { InstructorMediaAssetUploadButton } from '@/components/instructor/InstructorMediaAssetUploadButton';
import { useToast } from '@/components/toast/toast-provider';
import { instructorWorkspaceApi } from '@/lib/api/endpoints';
import { resolveMediaUrl } from '@/lib/content/media';

type RevisionRendererContext = {
  side: 'revision' | 'current';
  otherValue: unknown;
  fieldKey: string;
};

function renderUrlChip(value: unknown, emptyLabel: string) {
  if (typeof value !== 'string' || !value.trim()) {
    return <span className="italic text-[var(--site-subtle)]">{emptyLabel}</span>;
  }

  const href = value.trim();
  let label = href;

  try {
    const parsed = new URL(href, 'http://localhost');
    label = `${parsed.hostname}${parsed.pathname}`.replace(/^localhost/, '');
  } catch {
    label = href;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-1 text-xs font-semibold text-[var(--site-text)] transition hover:border-primary/30 hover:text-primary"
    >
      <span className="truncate">{label || href}</span>
    </a>
  );
}

export function InstructorModuleEditClient({ id }: { id: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const moduleQuery = useQuery({
    queryKey: ['instructor', 'modules', id],
    queryFn: () => instructorWorkspaceApi.modules.get(id),
  });
  const lessonsQuery = useQuery({
    enabled: Boolean(moduleQuery.data?.id),
    queryKey: ['instructor', 'modules', id, 'lessons'],
    queryFn: () => instructorWorkspaceApi.modules.lessons(id),
  });
  const mediaAssetsQuery = useQuery({
    queryKey: ['instructor', 'media-assets'],
    queryFn: instructorWorkspaceApi.mediaAssets,
  });

  const [form, setForm] = React.useState<null | {
    title: string;
    description: string;
    introVideoAssetId: string;
    introVideoUrl: string;
    order: string;
    status: string;
  }>(null);
  const [reviewDraftNote, setReviewDraftNote] = React.useState('');

  React.useEffect(() => {
    if (!moduleQuery.data) return;
    setForm({
      title: moduleQuery.data.title,
      description: moduleQuery.data.description ?? '',
      introVideoAssetId: moduleQuery.data.introVideoAssetId ?? '',
      introVideoUrl: moduleQuery.data.introVideoUrl ?? '',
      order: String(moduleQuery.data.order ?? 0),
      status: moduleQuery.data.status,
    });
  }, [moduleQuery.data]);

  const videoAssets = (mediaAssetsQuery.data ?? []).filter((asset) => asset.type === 'video');
  const videoTitlesById = React.useMemo(
    () =>
      new Map(videoAssets.map((asset) => [asset.id, asset.title || asset.altText || asset.url])),
    [videoAssets],
  );

  const save = useMutation({
    mutationFn: async () =>
      instructorWorkspaceApi.modules.update(id, {
        title: form?.title,
        description: form?.description || undefined,
        introVideoAssetId: form?.introVideoAssetId || undefined,
        introVideoUrl: form?.introVideoUrl || undefined,
        order: Number(form?.order ?? 0),
      }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['instructor', 'modules', id] }),
        qc.invalidateQueries({ queryKey: ['instructor', 'modules', id, 'lessons'] }),
        qc.invalidateQueries({ queryKey: ['instructor', 'workspace'] }),
      ]);
      toast({ title: 'Module saved', description: 'Your module updates were saved.' });
    },
    onError: (error) =>
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const restoreRevision = useMutation({
    mutationFn: (revisionId: string) => instructorWorkspaceApi.modules.restoreRevision(id, revisionId),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['instructor', 'modules', id] }),
        qc.invalidateQueries({ queryKey: ['instructor', 'modules', id, 'lessons'] }),
        qc.invalidateQueries({ queryKey: ['instructor', 'workspace'] }),
      ]);
      toast({
        title: 'Revision restored',
        description: 'The module was rolled back to the selected revision.',
      });
    },
    onError: (error) =>
      toast({
        title: 'Restore failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const createLesson = useMutation({
    mutationFn: async (input: { title: string; slug: string }) =>
      instructorWorkspaceApi.modules.createLesson(id, input),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['instructor', 'modules', id, 'lessons'] }),
        qc.invalidateQueries({ queryKey: ['instructor', 'workspace'] }),
      ]);
      toast({
        title: 'Draft lesson created',
        description: 'You can keep building it from this workspace.',
      });
    },
    onError: (error) =>
      toast({
        title: 'Could not create lesson',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const submitReview = useMutation({
    mutationFn: async () =>
      instructorWorkspaceApi.modules.submitReview(id, reviewDraftNote.trim() || undefined),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['instructor', 'modules', id] }),
        qc.invalidateQueries({ queryKey: ['instructor', 'modules', id, 'lessons'] }),
        qc.invalidateQueries({ queryKey: ['instructor', 'workspace'] }),
      ]);
      setReviewDraftNote('');
      toast({
        title: 'Submitted for review',
        description: 'The module is now waiting for admin review.',
      });
    },
    onError: (error) =>
      toast({
        title: 'Submit failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  if (moduleQuery.isLoading || !form) {
    return (
      <main className="space-y-6">
        <div className="h-20 rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
        <div className="h-[28rem] rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
      </main>
    );
  }

  if (moduleQuery.isError) {
    return (
      <main className="rounded-[1.8rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
        <div className="font-semibold">Could not load module</div>
        <div className="mt-2 text-[var(--site-danger)]/80">
          {moduleQuery.error instanceof Error ? moduleQuery.error.message : 'Unknown error'}
        </div>
      </main>
    );
  }

  const module = moduleQuery.data!;
  const selectedVideoAsset =
    videoAssets.find((asset) => asset.id === form.introVideoAssetId) ?? module.introVideoAsset;
  const previewVideoUrl = resolveMediaUrl(selectedVideoAsset, form.introVideoUrl);
  const currentRevisionSnapshot = {
    title: form.title,
    description: form.description || null,
    introVideoAssetId: form.introVideoAssetId || null,
    introVideoUrl: form.introVideoUrl || null,
    order: form.order === '' ? null : Number(form.order),
  };

  const revisionFieldRenderers = {
    introVideoAssetId: (value: unknown, context: RevisionRendererContext) => {
      if (typeof value !== 'string' || !value.trim()) {
        return <span className="italic text-[var(--site-subtle)]">No linked intro video</span>;
      }

      const previous =
        typeof context.otherValue === 'string' && context.otherValue.trim()
          ? videoTitlesById.get(context.otherValue) ?? context.otherValue
          : null;

      return (
        <div className="space-y-2">
          <span className="inline-flex rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-1 text-xs font-semibold text-[var(--site-text)]">
            {videoTitlesById.get(value) ?? value}
          </span>
          {previous ? <div className="text-xs text-[var(--site-muted)]">Previously: {previous}</div> : null}
        </div>
      );
    },
    introVideoUrl: (value: unknown) => renderUrlChip(value, 'No direct intro video URL'),
  };

  return (
    <main className="space-y-6">
      <AdminPageIntro
        title="Manage Module"
        description="Refine the sequence, intro video, and lesson order for this module."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/instructor/courses/${module.courseId}/edit`}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 text-lg font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to course
            </Link>
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.2rem] bg-primary px-5 text-lg font-semibold text-primary-foreground shadow-[0_18px_34px_rgba(59,130,246,0.24)] transition hover:bg-primary/90 disabled:opacity-70"
            >
              <Save className="h-5 w-5" />
              {save.isPending ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <AdminSurface>
          <div className="grid gap-5 md:grid-cols-2">
            <AdminField label="Module Title" className="md:col-span-2">
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className={adminInputClassName}
              />
            </AdminField>

            <AdminField label="Description" className="md:col-span-2">
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                rows={5}
                className={adminTextareaClassName}
              />
            </AdminField>

            <AdminField label="Module Intro Video" className="md:col-span-2">
              <div className="space-y-4">
                <AdminMediaAssetPicker
                  kind="video"
                  assets={videoAssets}
                  value={form.introVideoAssetId}
                  onChange={(assetId) => setForm({ ...form, introVideoAssetId: assetId })}
                  emptyLabel="Use a direct video URL instead"
                  buttonLabel="Browse video library"
                />
                <input
                  value={form.introVideoUrl}
                  onChange={(event) => setForm({ ...form, introVideoUrl: event.target.value })}
                  className={adminInputClassName}
                  placeholder="https://... or /uploads/videos/..."
                />
                <div className="flex flex-wrap items-center gap-3">
                  <InstructorMediaAssetUploadButton
                    kind="video"
                    onUploaded={(asset) =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              introVideoAssetId: asset.id,
                              introVideoUrl: '',
                            }
                          : current,
                      )
                    }
                  />
                  <span className="text-sm text-[var(--site-muted)]">
                    This video appears inside the module experience, not on the course dashboard.
                  </span>
                </div>
                {previewVideoUrl ? (
                  <MediaVideoFrame
                    url={previewVideoUrl}
                    title={`${form.title || 'Module'} video preview`}
                    caption="Learners will see this inside the module overview."
                  />
                ) : null}
              </div>
            </AdminField>

            <AdminField label="Module Order">
              <input
                value={form.order}
                onChange={(event) => setForm({ ...form, order: event.target.value })}
                className={adminInputClassName}
              />
            </AdminField>

            <AdminField label="Status">
              <div className="flex h-[3.4rem] items-center rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4">
                <AdminStatusPill tone={statusTone(form.status)}>{form.status.toUpperCase()}</AdminStatusPill>
              </div>
            </AdminField>
          </div>
        </AdminSurface>

        <div className="space-y-6">
          <ContentRevisionPanel
            title="Module revisions"
            revisions={module.revisions}
            onRestore={(revisionId) => restoreRevision.mutate(revisionId)}
            restoringRevisionId={restoreRevision.isPending ? restoreRevision.variables : null}
            currentSnapshot={currentRevisionSnapshot}
            fieldLabels={{
              introVideoAssetId: 'Intro video asset',
              introVideoUrl: 'Intro video URL',
            }}
            fieldRenderers={revisionFieldRenderers}
          />

          <AdminSurface>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
              Publishing Status
            </div>
            <div className="mt-4">
              <AdminStatusPill tone={statusTone(form.status)}>{form.status.toUpperCase()}</AdminStatusPill>
            </div>
            <div className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
              Publishing is reviewed by admin. You can keep refining the module content here.
            </div>
          </AdminSurface>

          <ContentReviewWorkflowPanel
            audience="instructor"
            reviewStatus={module.reviewStatus}
            reviewNotes={module.reviewNotes}
            draftNote={reviewDraftNote}
            onDraftNoteChange={setReviewDraftNote}
            onSubmitForReview={() => submitReview.mutate()}
            isSubmitting={submitReview.isPending}
          />

          {mediaAssetsQuery.isError ? (
            <div className="rounded-[1.2rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
              {mediaAssetsQuery.error instanceof Error
                ? mediaAssetsQuery.error.message
                : 'Media assets failed to load.'}
            </div>
          ) : null}

          {save.isError || restoreRevision.isError || createLesson.isError || submitReview.isError ? (
            <div className="rounded-[1.2rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
              {save.error instanceof Error
                ? save.error.message
                : restoreRevision.error instanceof Error
                  ? restoreRevision.error.message
                  : createLesson.error instanceof Error
                    ? createLesson.error.message
                    : submitReview.error instanceof Error
                      ? submitReview.error.message
                    : 'Action failed'}
            </div>
          ) : null}
        </div>
      </div>

      <AdminSurface>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <BookOpenText className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-[var(--site-text)]">Lessons</h2>
              <p className="mt-1 text-base text-[var(--site-muted)]">
                Create and manage the lesson flow inside this module.
              </p>
            </div>
          </div>
          <CreateLessonInline
            onCreate={(title, slug) => createLesson.mutate({ title, slug })}
            disabled={createLesson.isPending}
          />
        </div>

        {lessonsQuery.isLoading ? (
          <div className="mt-5 text-sm text-[var(--site-muted)]">Loading lessons...</div>
        ) : lessonsQuery.isError ? (
          <div className="mt-5 text-sm text-[var(--site-muted)]">
            {lessonsQuery.error instanceof Error ? lessonsQuery.error.message : 'Failed to load lessons'}
          </div>
        ) : (lessonsQuery.data?.length ?? 0) === 0 ? (
          <div className="mt-5 text-sm text-[var(--site-muted)]">No lessons yet.</div>
        ) : (
          <div className="mt-6 space-y-3">
            {lessonsQuery.data!.map((lesson) => (
              <div
                key={lesson.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 py-4"
              >
                <div>
                  <div className="text-xl font-semibold text-[var(--site-text)]">{lesson.title}</div>
                  <div className="mt-2 text-sm uppercase tracking-[0.16em] text-[var(--site-subtle)]">
                    {lesson.slug} | {lesson.status} | order {lesson.order}
                  </div>
                </div>
                <Link
                  href={`/instructor/lessons/${lesson.id}/edit`}
                  className="inline-flex h-11 items-center justify-center rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
                >
                  Manage lesson
                </Link>
              </div>
            ))}
          </div>
        )}
      </AdminSurface>
    </main>
  );
}

function CreateLessonInline({
  onCreate,
  disabled,
}: {
  onCreate: (title: string, slug: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [slug, setSlug] = React.useState('');

  React.useEffect(() => {
    if (!title.trim() || slug.trim()) return;
    setSlug(
      title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    );
  }, [slug, title]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
      >
        <Plus className="h-4 w-4" />
        New lesson
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Lesson title"
        className="h-12 min-w-[220px] rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-sm text-[var(--site-text)] outline-none"
      />
      <input
        value={slug}
        onChange={(event) => setSlug(event.target.value)}
        placeholder="lesson-slug"
        className="h-12 min-w-[220px] rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-sm text-[var(--site-text)] outline-none"
      />
      <button
        type="button"
        onClick={() => {
          onCreate(title.trim(), slug.trim());
          setTitle('');
          setSlug('');
          setOpen(false);
        }}
        disabled={disabled || !title.trim() || !slug.trim()}
        className="inline-flex h-12 items-center justify-center rounded-[1rem] bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        Create
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setTitle('');
          setSlug('');
        }}
        className="inline-flex h-12 items-center justify-center rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-sm font-semibold text-[var(--site-text)]"
      >
        Cancel
      </button>
    </div>
  );
}

function statusTone(status: string) {
  if (status === 'published') return 'emerald' as const;
  if (status === 'archived') return 'slate' as const;
  return 'orange' as const;
}
