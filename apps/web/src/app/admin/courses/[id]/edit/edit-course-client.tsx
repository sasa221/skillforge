'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Layers3, Plus, Save } from 'lucide-react';

import {
  AdminField,
  adminInputClassName,
  adminSelectClassName,
  adminTextareaClassName,
} from '@/components/admin/AdminForms';
import { AdminMediaAssetPicker } from '@/components/admin/AdminMediaAssetPicker';
import { AdminMediaAssetUploadButton } from '@/components/admin/AdminMediaAssetUploadButton';
import { CourseLinkedAssetsPanel } from '@/components/admin/CourseLinkedAssetsPanel';
import { ContentRevisionPanel } from '@/components/admin/ContentRevisionPanel';
import { ContentReviewWorkflowPanel } from '@/components/admin/ContentReviewWorkflowPanel';
import { AdminPageIntro, AdminStatusPill, AdminSurface } from '@/components/admin/AdminUi';
import { useToast } from '@/components/toast/toast-provider';
import { adminApi } from '@/lib/api/endpoints';

type RevisionRendererContext = {
  side: 'revision' | 'current';
  otherValue: unknown;
  fieldKey: string;
};

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function renderDiffPills({
  items,
  labelFor,
  tone = 'neutral',
}: {
  items: string[];
  labelFor: (value: string) => string;
  tone?: 'neutral' | 'primary';
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={
            tone === 'primary'
              ? 'rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary'
              : 'rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-1 text-xs font-semibold text-[var(--site-text)]'
          }
        >
          {labelFor(item)}
        </span>
      ))}
    </div>
  );
}

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

export function EditCourseClient({ id }: { id: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const course = useQuery({
    queryKey: ['admin', 'courses', id],
    queryFn: () => adminApi.courses.get(id),
  });
  const skills = useQuery({ queryKey: ['admin', 'skills'], queryFn: adminApi.skills.list });
  const instructors = useQuery({
    queryKey: ['admin', 'instructors'],
    queryFn: adminApi.instructors.list,
  });
  const mediaAssets = useQuery({
    queryKey: ['admin', 'media-assets'],
    queryFn: adminApi.mediaAssets.list,
  });
  const modules = useQuery({
    enabled: Boolean(course.data?.id),
    queryKey: ['admin', 'courses', id, 'modules'],
    queryFn: () => adminApi.courses.modules(id),
  });

  const [form, setForm] = React.useState<any>(null);
  const [reviewDraftNote, setReviewDraftNote] = React.useState('');

  React.useEffect(() => {
    if (!course.data) return;
    setForm({
      title: course.data.title,
      slug: course.data.slug,
      description: course.data.description ?? '',
      instructorId: course.data.instructorId ?? '',
      coverImageAssetId: course.data.coverImageAssetId ?? '',
      introVideoAssetId: course.data.introVideoAssetId ?? '',
      coverImageUrl: course.data.coverImageUrl ?? '',
      introVideoUrl: course.data.introVideoUrl ?? '',
      difficulty: course.data.difficulty,
      estimatedMinutes: course.data.estimatedMinutes ?? '',
      tags: (course.data.tags ?? []).join(', '),
      requiresSequentialModules: course.data.requiresSequentialModules ?? true,
      status: course.data.status,
      skillIds: (course.data.skills ?? []).map((skill: any) => skill.skill.id),
    });
  }, [course.data]);

  const imageAssets = (mediaAssets.data ?? []).filter((asset) => asset.type === 'image');
  const videoAssets = (mediaAssets.data ?? []).filter((asset) => asset.type === 'video');
  const selectedInstructor =
    (instructors.data ?? []).find((instructor) => instructor.id === form?.instructorId) ?? null;
  const selectedCoverAsset =
    imageAssets.find((asset) => asset.id === form?.coverImageAssetId) ?? null;
  const selectedIntroVideoAsset =
    videoAssets.find((asset) => asset.id === form?.introVideoAssetId) ?? null;
  const skillTitlesById = React.useMemo(
    () => new Map((skills.data ?? []).map((skill) => [skill.id, skill.title])),
    [skills.data],
  );
  const instructorNamesById = React.useMemo(
    () =>
      new Map(
        (instructors.data ?? []).map((instructor) => [
          instructor.id,
          instructor.title ? `${instructor.fullName} - ${instructor.title}` : instructor.fullName,
        ]),
      ),
    [instructors.data],
  );
  const mediaTitlesById = React.useMemo(
    () =>
      new Map(
        (mediaAssets.data ?? []).map((asset) => [
          asset.id,
          asset.title || asset.altText || asset.url,
        ]),
      ),
    [mediaAssets.data],
  );
  const currentRevisionSnapshot = form
    ? {
        title: form.title,
        slug: form.slug,
        description: form.description || null,
        instructorId: form.instructorId || null,
        coverImageAssetId: form.coverImageAssetId || null,
        introVideoAssetId: form.introVideoAssetId || null,
        coverImageUrl: form.coverImageUrl || null,
        introVideoUrl: form.introVideoUrl || null,
        difficulty: form.difficulty,
        estimatedMinutes:
          form.estimatedMinutes === '' || form.estimatedMinutes === null
            ? null
            : Number(form.estimatedMinutes),
        tags: String(form.tags || '')
          .split(',')
          .map((tag: string) => tag.trim())
          .filter(Boolean),
        requiresSequentialModules: Boolean(form.requiresSequentialModules),
        status: form.status,
        order: course.data?.order ?? null,
        skillIds: [...(form.skillIds ?? [])].sort(),
      }
    : null;
  const revisionFieldRenderers = React.useMemo(
    () => ({
      skillIds: (value: unknown, context: RevisionRendererContext) => {
        const skillIds = toStringArray(value);
        const otherSkillIds = toStringArray(context.otherValue);

        if (skillIds.length === 0) {
          return <span className="italic text-[var(--site-subtle)]">No linked skills</span>;
        }

        const added = skillIds.filter((skillId) => !otherSkillIds.includes(skillId));
        const removed = otherSkillIds.filter((skillId) => !skillIds.includes(skillId));

        return (
          <div className="space-y-2">
            {renderDiffPills({
              items: skillIds,
              labelFor: (skillId) => skillTitlesById.get(skillId) ?? skillId,
            })}
            {added.length > 0 ? (
              <div className="text-xs text-emerald-700">
                Added: {added.map((skillId) => skillTitlesById.get(skillId) ?? skillId).join(', ')}
              </div>
            ) : null}
            {removed.length > 0 ? (
              <div className="text-xs text-rose-700">
                Removed: {removed.map((skillId) => skillTitlesById.get(skillId) ?? skillId).join(', ')}
              </div>
            ) : null}
          </div>
        );
      },
      tags: (value: unknown, context: RevisionRendererContext) => {
        const tags = toStringArray(value);
        const otherTags = toStringArray(context.otherValue);

        if (tags.length === 0) {
          return <span className="italic text-[var(--site-subtle)]">No tags</span>;
        }

        const added = tags.filter((tag) => !otherTags.includes(tag));
        const removed = otherTags.filter((tag) => !tags.includes(tag));

        return (
          <div className="space-y-2">
            {renderDiffPills({
              items: tags,
              labelFor: (tag) => tag,
              tone: 'primary',
            })}
            {added.length > 0 ? (
              <div className="text-xs text-emerald-700">Added: {added.join(', ')}</div>
            ) : null}
            {removed.length > 0 ? (
              <div className="text-xs text-rose-700">Removed: {removed.join(', ')}</div>
            ) : null}
          </div>
        );
      },
      instructorId: (value: unknown, context: RevisionRendererContext) => {
        if (typeof value !== 'string' || !value.trim()) {
          return <span className="italic text-[var(--site-subtle)]">No instructor assigned</span>;
        }

        const previous =
          typeof context.otherValue === 'string' && context.otherValue.trim()
            ? instructorNamesById.get(context.otherValue) ?? context.otherValue
            : null;

        return (
          <div className="space-y-2">
            <span className="inline-flex rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-1 text-xs font-semibold text-[var(--site-text)]">
              {instructorNamesById.get(value) ?? value}
            </span>
            {previous ? <div className="text-xs text-[var(--site-muted)]">Previously: {previous}</div> : null}
          </div>
        );
      },
      coverImageAssetId: (value: unknown, context: RevisionRendererContext) => {
        if (typeof value !== 'string' || !value.trim()) {
          return <span className="italic text-[var(--site-subtle)]">No linked cover asset</span>;
        }

        const previous =
          typeof context.otherValue === 'string' && context.otherValue.trim()
            ? mediaTitlesById.get(context.otherValue) ?? context.otherValue
            : null;

        return (
          <div className="space-y-2">
            <span className="inline-flex rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-1 text-xs font-semibold text-[var(--site-text)]">
              {mediaTitlesById.get(value) ?? value}
            </span>
            {previous ? <div className="text-xs text-[var(--site-muted)]">Previously: {previous}</div> : null}
          </div>
        );
      },
      introVideoAssetId: (value: unknown, context: RevisionRendererContext) => {
        if (typeof value !== 'string' || !value.trim()) {
          return <span className="italic text-[var(--site-subtle)]">No linked intro video</span>;
        }

        const previous =
          typeof context.otherValue === 'string' && context.otherValue.trim()
            ? mediaTitlesById.get(context.otherValue) ?? context.otherValue
            : null;

        return (
          <div className="space-y-2">
            <span className="inline-flex rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-1 text-xs font-semibold text-[var(--site-text)]">
              {mediaTitlesById.get(value) ?? value}
            </span>
            {previous ? <div className="text-xs text-[var(--site-muted)]">Previously: {previous}</div> : null}
          </div>
        );
      },
      coverImageUrl: (value: unknown) => renderUrlChip(value, 'No direct cover image URL'),
      introVideoUrl: (value: unknown) => renderUrlChip(value, 'No direct intro video URL'),
    }),
    [instructorNamesById, mediaTitlesById, skillTitlesById],
  );
  const saveLabel =
    form?.status === 'published'
      ? 'Publish Changes'
      : form?.status === 'archived'
        ? 'Archive Changes'
        : 'Save Draft';

  const save = useMutation({
    mutationFn: async () =>
      adminApi.courses.update(id, {
        ...form,
        instructorId: form.instructorId || undefined,
        coverImageAssetId: form.coverImageAssetId || undefined,
        introVideoAssetId: form.introVideoAssetId || undefined,
        estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : undefined,
        tags: String(form.tags || '')
          .split(',')
          .map((tag: string) => tag.trim())
          .filter(Boolean),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'courses', id] });
      await qc.invalidateQueries({ queryKey: ['admin', 'courses'] });
      toast({ title: 'Course saved', description: 'Your changes were applied.' });
    },
    onError: (error) =>
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const restoreRevision = useMutation({
    mutationFn: (revisionId: string) => adminApi.courses.restoreRevision(id, revisionId),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'courses', id] }),
        qc.invalidateQueries({ queryKey: ['admin', 'courses'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'courses', id, 'modules'] }),
      ]);
      toast({ title: 'Revision restored', description: 'The course was rolled back to the selected revision.' });
    },
    onError: (error) =>
      toast({
        title: 'Restore failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const approveReview = useMutation({
    mutationFn: async () => adminApi.courses.approveReview(id, reviewDraftNote.trim() || undefined),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'courses', id] }),
        qc.invalidateQueries({ queryKey: ['admin', 'courses'] }),
      ]);
      setReviewDraftNote('');
      toast({ title: 'Review approved', description: 'This course can now be published.' });
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
      adminApi.courses.requestChanges(id, reviewDraftNote.trim() || undefined),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'courses', id] }),
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

  const createModule = useMutation({
    mutationFn: async (title: string) => adminApi.courses.createModule(id, { title, status: 'draft' }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'courses', id, 'modules'] });
    },
  });

  if (course.isLoading || !form) {
    return (
      <main className="space-y-6">
        <div className="h-20 rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
        <div className="h-[36rem] rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
      </main>
    );
  }

  if (course.isError) {
    return (
      <main className="rounded-[1.8rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
        <div className="font-semibold">Could not load course</div>
        <div className="mt-2 text-[var(--site-danger)]/80">
          {course.error instanceof Error ? course.error.message : 'Unknown error'}
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <AdminPageIntro
        title="Edit Course"
        description="Refine metadata, publishing state, linked skills, and module structure."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/courses"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 text-lg font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_420px]">
        <AdminSurface>
          <div className="grid gap-5 md:grid-cols-2">
            <AdminField label="Course Title" className="md:col-span-2">
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className={adminInputClassName}
              />
            </AdminField>

            <AdminField label="Slug" className="md:col-span-2">
              <input
                value={form.slug}
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
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

            <AdminField label="Instructor">
              <select
                value={form.instructorId}
                onChange={(event) => setForm({ ...form, instructorId: event.target.value })}
                className={adminSelectClassName}
              >
                <option value="">No instructor assigned yet</option>
                {(instructors.data ?? []).map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.fullName}
                    {instructor.title ? ` - ${instructor.title}` : ''}
                  </option>
                ))}
              </select>
            </AdminField>

            <AdminField label="Cover Image Asset">
              <div className="space-y-3">
                <AdminMediaAssetPicker
                  kind="image"
                  assets={imageAssets}
                  value={form.coverImageAssetId}
                  onChange={(assetId) => setForm({ ...form, coverImageAssetId: assetId })}
                  emptyLabel="Use direct image URL instead"
                  buttonLabel="Browse image library"
                />
                <AdminMediaAssetUploadButton
                  kind="image"
                  onUploaded={(asset) =>
                    setForm((current: any) => ({
                      ...current,
                      coverImageAssetId: asset.id,
                      coverImageUrl: '',
                    }))
                  }
                />
              </div>
            </AdminField>

            <AdminField label="Cover Image URL" className="md:col-span-2">
              <input
                value={form.coverImageUrl}
                onChange={(event) => setForm({ ...form, coverImageUrl: event.target.value })}
                className={adminInputClassName}
                placeholder="https://..."
              />
            </AdminField>

            <AdminField label="Intro Video Asset">
              <div className="space-y-3">
                <AdminMediaAssetPicker
                  kind="video"
                  assets={videoAssets}
                  value={form.introVideoAssetId}
                  onChange={(assetId) => setForm({ ...form, introVideoAssetId: assetId })}
                  emptyLabel="Use direct video URL instead"
                  buttonLabel="Browse video library"
                />
                <AdminMediaAssetUploadButton
                  kind="video"
                  onUploaded={(asset) =>
                    setForm((current: any) => ({
                      ...current,
                      introVideoAssetId: asset.id,
                      introVideoUrl: '',
                    }))
                  }
                />
              </div>
            </AdminField>

            <AdminField label="Course Intro Video URL" className="md:col-span-2">
              <input
                value={form.introVideoUrl}
                onChange={(event) => setForm({ ...form, introVideoUrl: event.target.value })}
                className={adminInputClassName}
                placeholder="https://... or local/video.mp4"
              />
            </AdminField>

            <AdminField label="Difficulty">
              <select
                value={form.difficulty}
                onChange={(event) => setForm({ ...form, difficulty: event.target.value })}
                className={adminSelectClassName}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </AdminField>

            <AdminField label="Estimated Minutes">
              <input
                value={form.estimatedMinutes}
                onChange={(event) => setForm({ ...form, estimatedMinutes: event.target.value })}
                className={adminInputClassName}
              />
            </AdminField>

            <AdminField label="Tags" className="md:col-span-2">
              <input
                value={form.tags}
                onChange={(event) => setForm({ ...form, tags: event.target.value })}
                className={adminInputClassName}
                placeholder="sql, analytics, joins"
              />
            </AdminField>
          </div>
        </AdminSurface>

        <div className="space-y-6">
          <AdminSurface>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
              Publishing
            </div>
            <div className="mt-4">
              <select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
                className={adminSelectClassName}
              >
                <option value="draft">Draft</option>
                <option
                  value="published"
                  disabled={course.data?.reviewStatus !== 'approved'}
                >
                  {course.data?.reviewStatus === 'approved'
                    ? 'Published'
                    : 'Published (approve review first)'}
                </option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="mt-4">
              <AdminStatusPill tone={statusTone(form.status)}>{form.status.toUpperCase()}</AdminStatusPill>
            </div>
          </AdminSurface>

          <ContentReviewWorkflowPanel
            audience="admin"
            reviewStatus={course.data?.reviewStatus ?? 'draft'}
            reviewNotes={course.data?.reviewNotes ?? null}
            draftNote={reviewDraftNote}
            onDraftNoteChange={setReviewDraftNote}
            onApprove={() => approveReview.mutate()}
            isApproving={approveReview.isPending}
            onRequestChanges={() => requestChanges.mutate()}
            isRequestingChanges={requestChanges.isPending}
          />

          <ContentRevisionPanel
            title="Course Revisions"
            revisions={course.data?.revisions}
            onRestore={(revisionId) => restoreRevision.mutate(revisionId)}
            restoringRevisionId={restoreRevision.isPending ? restoreRevision.variables : null}
            currentSnapshot={currentRevisionSnapshot}
            fieldLabels={{
              instructorId: 'Instructor',
              coverImageAssetId: 'Cover image asset',
              introVideoAssetId: 'Intro video asset',
              coverImageUrl: 'Cover image URL',
              introVideoUrl: 'Intro video URL',
              estimatedMinutes: 'Estimated minutes',
              requiresSequentialModules: 'Sequential module requirement',
              skillIds: 'Linked skills',
            }}
            fieldRenderers={revisionFieldRenderers}
          />

          <CourseLinkedAssetsPanel
            instructor={selectedInstructor}
            coverAsset={selectedCoverAsset}
            coverImageUrl={form.coverImageUrl}
            introVideoAsset={selectedIntroVideoAsset}
            introVideoUrl={form.introVideoUrl}
          />

          <AdminSurface>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
              Module Unlocking
            </div>
            <label className="mt-4 flex items-start gap-3 text-sm text-[var(--site-muted)]">
              <input
                type="checkbox"
                checked={Boolean(form.requiresSequentialModules)}
                onChange={(event) =>
                  setForm({ ...form, requiresSequentialModules: event.target.checked })
                }
                className="mt-1 h-4 w-4 rounded border-white/20"
              />
              <span>
                Lock each module until the previous module is completed and its checkpoint is passed.
              </span>
            </label>
          </AdminSurface>

          <AdminSurface>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
              Linked Skills
            </div>
            {skills.isLoading ? (
              <div className="mt-4 text-sm text-[var(--site-muted)]">Loading skills...</div>
            ) : skills.isError ? (
              <div className="mt-4 text-sm text-[var(--site-muted)]">
                {skills.error instanceof Error ? skills.error.message : 'Failed to load skills'}
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-3">
                {(skills.data ?? []).map((skill) => {
                  const checked = form.skillIds.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() =>
                        setForm((current: any) => ({
                          ...current,
                          skillIds: checked
                            ? current.skillIds.filter((value: string) => value !== skill.id)
                            : [...current.skillIds, skill.id],
                        }))
                      }
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        checked
                          ? 'border-primary/20 bg-primary/10 text-primary'
                          : 'border-[var(--site-border)] bg-[var(--site-surface-alt)] text-[var(--site-muted)] hover:bg-[var(--site-primary-soft)]'
                      }`}
                    >
                      {skill.title}
                    </button>
                  );
                })}
              </div>
            )}
          </AdminSurface>

          {instructors.isError || mediaAssets.isError ? (
            <div className="rounded-[1.2rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
              {instructors.error instanceof Error
                ? instructors.error.message
                : mediaAssets.error instanceof Error
                  ? mediaAssets.error.message
                  : 'Related content records failed to load.'}
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
              <Layers3 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-[var(--site-text)]">Modules</h2>
              <p className="mt-1 text-base text-[var(--site-muted)]">Manage the course structure and lesson flow.</p>
            </div>
          </div>
          <CreateInline
            label="New module"
            onCreate={(value) => createModule.mutate(value)}
            disabled={createModule.isPending}
          />
        </div>

        {modules.isLoading ? (
          <div className="mt-5 text-sm text-[var(--site-muted)]">Loading modules...</div>
        ) : modules.isError ? (
          <div className="mt-5 text-sm text-[var(--site-muted)]">
            {modules.error instanceof Error ? modules.error.message : 'Failed to load modules'}
          </div>
        ) : (modules.data?.length ?? 0) === 0 ? (
          <div className="mt-5 text-sm text-[var(--site-muted)]">No modules yet.</div>
        ) : (
          <div className="mt-6 space-y-3">
            {modules.data!.map((module) => (
              <div
                key={module.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 py-4"
              >
                <div>
                  <div className="text-xl font-semibold text-[var(--site-text)]">{module.title}</div>
                  <div className="mt-2 text-sm uppercase tracking-[0.16em] text-[var(--site-subtle)]">
                    {module.status} | order {module.order}
                  </div>
                </div>
                <Link
                  href={`/admin/modules/${module.id}/edit`}
                  className="inline-flex h-11 items-center justify-center rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
                >
                  Edit Module
                </Link>
              </div>
            ))}
          </div>
        )}
      </AdminSurface>
    </main>
  );
}

function CreateInline({
  label,
  onCreate,
  disabled,
}: {
  label: string;
  onCreate: (title: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
      >
        <Plus className="h-4 w-4" />
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={label}
        className="h-12 min-w-[240px] rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-sm text-[var(--site-text)] outline-none"
      />
      <button
        type="button"
        onClick={() => {
          onCreate(title);
          setTitle('');
          setOpen(false);
        }}
        disabled={disabled || !title.trim()}
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
