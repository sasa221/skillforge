'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpenText, Plus, Save } from 'lucide-react';

import {
  AdminField,
  adminInputClassName,
  adminSelectClassName,
  adminTextareaClassName,
} from '@/components/admin/AdminForms';
import { AdminMediaAssetPicker } from '@/components/admin/AdminMediaAssetPicker';
import { AdminMediaAssetUploadButton } from '@/components/admin/AdminMediaAssetUploadButton';
import { ContentRevisionPanel } from '@/components/admin/ContentRevisionPanel';
import { ContentReviewWorkflowPanel } from '@/components/admin/ContentReviewWorkflowPanel';
import { AdminPageIntro, AdminStatusPill, AdminSurface } from '@/components/admin/AdminUi';
import { MediaVideoFrame } from '@/components/site/MediaVideoFrame';
import { useToast } from '@/components/toast/toast-provider';
import { adminApi } from '@/lib/api/endpoints';
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

export function EditModuleClient({ id }: { id: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const mod = useQuery({
    queryKey: ['admin', 'modules', id],
    queryFn: () => adminApi.modules.get(id),
  });
  const mediaAssets = useQuery({
    queryKey: ['admin', 'media-assets'],
    queryFn: adminApi.mediaAssets.list,
  });
  const lessons = useQuery({
    enabled: Boolean(mod.data?.id),
    queryKey: ['admin', 'modules', id, 'lessons'],
    queryFn: () => adminApi.modules.lessons(id),
  });

  const [form, setForm] = React.useState<any>(null);
  const [reviewDraftNote, setReviewDraftNote] = React.useState('');

  React.useEffect(() => {
    if (!mod.data) return;
    setForm({
      title: mod.data.title,
      description: mod.data.description ?? '',
      introVideoAssetId: mod.data.introVideoAssetId ?? '',
      introVideoUrl: mod.data.introVideoUrl ?? '',
      order: String(mod.data.order ?? 0),
      status: mod.data.status,
    });
  }, [mod.data]);

  const videoAssets = (mediaAssets.data ?? []).filter((asset) => asset.type === 'video');
  const videoTitlesById = React.useMemo(
    () =>
      new Map(videoAssets.map((asset) => [asset.id, asset.title || asset.altText || asset.url])),
    [videoAssets],
  );
  const saveLabel =
    form?.status === 'published'
      ? 'Publish Changes'
      : form?.status === 'archived'
        ? 'Archive Changes'
        : 'Save Draft';

  const save = useMutation({
    mutationFn: async () =>
      adminApi.modules.update(id, {
        title: form.title,
        description: form.description,
        introVideoAssetId: form.introVideoAssetId || undefined,
        introVideoUrl: form.introVideoUrl || undefined,
        order: Number(form.order),
        status: form.status,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'modules', id] });
      await qc.invalidateQueries({ queryKey: ['admin', 'courses'] });
      toast({ title: 'Module saved', description: 'Your changes were applied.' });
    },
    onError: (error) =>
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const restoreRevision = useMutation({
    mutationFn: (revisionId: string) => adminApi.modules.restoreRevision(id, revisionId),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'modules', id] }),
        qc.invalidateQueries({ queryKey: ['admin', 'modules', id, 'lessons'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'courses'] }),
      ]);
      toast({ title: 'Revision restored', description: 'The module was rolled back to the selected revision.' });
    },
    onError: (error) =>
      toast({
        title: 'Restore failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const approveReview = useMutation({
    mutationFn: async () => adminApi.modules.approveReview(id, reviewDraftNote.trim() || undefined),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'modules', id] }),
        qc.invalidateQueries({ queryKey: ['admin', 'modules', id, 'lessons'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'courses'] }),
      ]);
      setReviewDraftNote('');
      toast({ title: 'Review approved', description: 'This module can now be published.' });
    },
    onError: (error) =>
      toast({
        title: 'Approval failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const requestChanges = useMutation({
    mutationFn: async () =>
      adminApi.modules.requestChanges(id, reviewDraftNote.trim() || undefined),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'modules', id] }),
        qc.invalidateQueries({ queryKey: ['admin', 'modules', id, 'lessons'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'courses'] }),
      ]);
      setReviewDraftNote('');
      toast({
        title: 'Changes requested',
        description: 'The instructor will see the requested updates.',
      });
    },
    onError: (error) =>
      toast({
        title: 'Request failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const createLesson = useMutation({
    mutationFn: async (input: { title: string; slug: string }) =>
      adminApi.modules.createLesson(id, { ...input, status: 'draft' }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'modules', id, 'lessons'] });
    },
  });

  if (mod.isLoading || !form) {
    return (
      <main className="space-y-6">
        <div className="h-20 rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
        <div className="h-[30rem] rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
      </main>
    );
  }

  if (mod.isError) {
    return (
      <main className="rounded-[1.8rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
        <div className="font-semibold">Could not load module</div>
        <div className="mt-2 text-[var(--site-danger)]/80">
          {mod.error instanceof Error ? mod.error.message : 'Unknown error'}
        </div>
      </main>
    );
  }

  const module = mod.data!;
  const previewVideoUrl = resolveMediaUrl(
    videoAssets.find((asset) => asset.id === form.introVideoAssetId) ?? module.introVideoAsset,
    form.introVideoUrl,
  );
  const currentRevisionSnapshot = form
    ? {
        title: form.title,
        description: form.description || null,
        introVideoAssetId: form.introVideoAssetId || null,
        introVideoUrl: form.introVideoUrl || null,
        order: form.order === '' || form.order === null ? null : Number(form.order),
        status: form.status,
      }
    : null;
  const revisionFieldRenderers = React.useMemo(
    () => ({
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
    }),
    [videoTitlesById],
  );

  return (
    <main className="space-y-6">
      <AdminPageIntro
        title="Edit Module"
        description="Tune sequencing, descriptions, and lesson flow inside the course."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/courses/${module.courseId}/edit`}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 text-lg font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Course
            </Link>
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.2rem] bg-primary px-5 text-lg font-semibold text-primary-foreground shadow-[0_18px_34px_rgba(249,115,22,0.24)] transition hover:bg-primary/90 disabled:opacity-70"
            >
              <Save className="h-5 w-5" />
              {save.isPending ? 'Saving...' : saveLabel}
            </button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_460px]">
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

            <AdminField label="Module Intro Video URL" className="md:col-span-2">
              <div className="space-y-4">
                <AdminMediaAssetPicker
                  kind="video"
                  assets={videoAssets}
                  value={form.introVideoAssetId}
                  onChange={(assetId) => setForm({ ...form, introVideoAssetId: assetId })}
                  emptyLabel="Use direct video URL instead"
                  buttonLabel="Browse video library"
                />
                <input
                  value={form.introVideoUrl}
                  onChange={(event) => setForm({ ...form, introVideoUrl: event.target.value })}
                  className={adminInputClassName}
                  placeholder="https://... or uploaded video URL"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <AdminMediaAssetUploadButton
                    kind="video"
                    onUploaded={(asset) =>
                      setForm((current: any) =>
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
                    Paste a hosted video link or upload a reusable media asset for this module intro.
                  </span>
                </div>
                {previewVideoUrl ? (
                  <MediaVideoFrame
                    url={previewVideoUrl}
                    title={`${form.title || 'Module'} video preview`}
                    caption="This video will appear inside the module learning experience, not on the course dashboard."
                  />
                ) : null}
              </div>
            </AdminField>

            <AdminField label="Order">
              <input
                value={form.order}
                onChange={(event) => setForm({ ...form, order: event.target.value })}
                className={adminInputClassName}
              />
            </AdminField>

            <AdminField label="Status">
              <select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
                className={adminSelectClassName}
              >
                <option value="draft">Draft</option>
                <option
                  value="published"
                  disabled={mod.data?.reviewStatus !== 'approved'}
                >
                  {mod.data?.reviewStatus === 'approved'
                    ? 'Published'
                    : 'Published (approve review first)'}
                </option>
                <option value="archived">Archived</option>
              </select>
            </AdminField>
          </div>
        </AdminSurface>

        <div className="space-y-6">
          <AdminSurface>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
              Module Status
            </div>
            <div className="mt-4">
              <AdminStatusPill tone={statusTone(form.status)}>{form.status.toUpperCase()}</AdminStatusPill>
            </div>
          </AdminSurface>

          <ContentReviewWorkflowPanel
            audience="admin"
            reviewStatus={mod.data?.reviewStatus ?? 'draft'}
            reviewNotes={mod.data?.reviewNotes ?? null}
            draftNote={reviewDraftNote}
            onDraftNoteChange={setReviewDraftNote}
            onApprove={() => approveReview.mutate()}
            isApproving={approveReview.isPending}
            onRequestChanges={() => requestChanges.mutate()}
            isRequestingChanges={requestChanges.isPending}
          />

          <ContentRevisionPanel
            title="Module Revisions"
            revisions={mod.data?.revisions}
            onRestore={(revisionId) => restoreRevision.mutate(revisionId)}
            restoringRevisionId={restoreRevision.isPending ? restoreRevision.variables : null}
            currentSnapshot={currentRevisionSnapshot}
            fieldLabels={{
              introVideoAssetId: 'Intro video asset',
              introVideoUrl: 'Intro video URL',
            }}
            fieldRenderers={revisionFieldRenderers}
          />

          {mediaAssets.isError ? (
            <div className="rounded-[1.2rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
              {mediaAssets.error instanceof Error
                ? mediaAssets.error.message
                : 'Media assets failed to load.'}
            </div>
          ) : null}

          {save.isError || restoreRevision.isError || approveReview.isError || requestChanges.isError ? (
            <div className="rounded-[1.2rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
              {save.error instanceof Error
                ? save.error.message
                : restoreRevision.error instanceof Error
                  ? restoreRevision.error.message
                  : approveReview.error instanceof Error
                    ? approveReview.error.message
                    : requestChanges.error instanceof Error
                      ? requestChanges.error.message
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
              <p className="mt-1 text-base text-[var(--site-muted)]">Create and manage every lesson inside this module.</p>
            </div>
          </div>
          <CreateLessonInline
            onCreate={(title, slug) => createLesson.mutate({ title, slug })}
            disabled={createLesson.isPending}
          />
        </div>

        {lessons.isLoading ? (
          <div className="mt-5 text-sm text-[var(--site-muted)]">Loading lessons...</div>
        ) : lessons.isError ? (
          <div className="mt-5 text-sm text-[var(--site-muted)]">
            {lessons.error instanceof Error ? lessons.error.message : 'Failed to load lessons'}
          </div>
        ) : (lessons.data?.length ?? 0) === 0 ? (
          <div className="mt-5 text-sm text-[var(--site-muted)]">No lessons yet.</div>
        ) : (
          <div className="mt-6 space-y-3">
            {lessons.data!.map((lesson) => (
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
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/admin/lessons/${lesson.id}/edit`}
                    className="inline-flex h-11 items-center justify-center rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
                  >
                    Edit Lesson
                  </Link>
                  {lesson.quiz ? (
                    <Link
                      href={`/admin/quizzes/${lesson.quiz.id}/edit`}
                      className="inline-flex h-11 items-center justify-center rounded-[1rem] border border-primary/15 bg-primary/10 px-4 text-sm font-semibold text-primary transition hover:bg-primary/15"
                    >
                      Open Quiz
                    </Link>
                  ) : null}
                </div>
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
        New Lesson
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
          onCreate(title, slug);
          setTitle('');
          setSlug('');
          setOpen(false);
        }}
        disabled={disabled || !title.trim() || !slug.trim()}
        className="inline-flex h-12 items-center justify-center rounded-[1rem] bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-70"
      >
        Create
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
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
