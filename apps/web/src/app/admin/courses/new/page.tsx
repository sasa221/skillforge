'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus } from 'lucide-react';

import {
  AdminField,
  adminInputClassName,
  adminSelectClassName,
  adminTextareaClassName,
} from '@/components/admin/AdminForms';
import { AdminMediaAssetPicker } from '@/components/admin/AdminMediaAssetPicker';
import { AdminMediaAssetUploadButton } from '@/components/admin/AdminMediaAssetUploadButton';
import { CourseLinkedAssetsPanel } from '@/components/admin/CourseLinkedAssetsPanel';
import { AdminPageIntro, AdminStatusPill, AdminSurface } from '@/components/admin/AdminUi';
import { adminApi } from '@/lib/api/endpoints';

export default function NewCoursePage() {
  const router = useRouter();
  const skills = useQuery({ queryKey: ['admin', 'skills'], queryFn: adminApi.skills.list });
  const instructors = useQuery({
    queryKey: ['admin', 'instructors'],
    queryFn: adminApi.instructors.list,
  });
  const mediaAssets = useQuery({
    queryKey: ['admin', 'media-assets'],
    queryFn: adminApi.mediaAssets.list,
  });

  const [title, setTitle] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [instructorId, setInstructorId] = React.useState('');
  const [coverImageAssetId, setCoverImageAssetId] = React.useState('');
  const [introVideoAssetId, setIntroVideoAssetId] = React.useState('');
  const [coverImageUrl, setCoverImageUrl] = React.useState('');
  const [introVideoUrl, setIntroVideoUrl] = React.useState('');
  const [difficulty, setDifficulty] =
    React.useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [estimatedMinutes, setEstimatedMinutes] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [requiresSequentialModules, setRequiresSequentialModules] = React.useState(true);
  const [status, setStatus] =
    React.useState<'draft' | 'published' | 'archived'>('draft');
  const [skillIds, setSkillIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!title.trim() || slug.trim()) return;
    setSlug(slugify(title));
  }, [slug, title]);

  const imageAssets = (mediaAssets.data ?? []).filter((asset) => asset.type === 'image');
  const videoAssets = (mediaAssets.data ?? []).filter((asset) => asset.type === 'video');
  const selectedInstructor =
    (instructors.data ?? []).find((instructor) => instructor.id === instructorId) ?? null;
  const selectedCoverAsset = imageAssets.find((asset) => asset.id === coverImageAssetId) ?? null;
  const selectedIntroVideoAsset =
    videoAssets.find((asset) => asset.id === introVideoAssetId) ?? null;

  const create = useMutation({
    mutationFn: async () =>
      adminApi.courses.create({
        title,
        slug,
        description,
        instructorId: instructorId || undefined,
        coverImageAssetId: coverImageAssetId || undefined,
        introVideoAssetId: introVideoAssetId || undefined,
        coverImageUrl: coverImageUrl || undefined,
        introVideoUrl: introVideoUrl || undefined,
        difficulty,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        requiresSequentialModules,
        status,
        skillIds,
      }),
    onSuccess: (course) => router.push(`/admin/courses/${course.id}/edit`),
  });

  const createDisabled = create.isPending || !title.trim() || !slug.trim();

  return (
    <main className="space-y-6">
      <AdminPageIntro
        title="Create New Course"
        description="Launch a polished draft with structure, skills, and publishing controls ready."
        actions={
          <Link
            href="/admin/courses"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 text-lg font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Courses
          </Link>
        }
      />

      <AdminSurface>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_320px]">
          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="Course Title" className="md:col-span-2">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className={adminInputClassName}
                  placeholder="SQL Fundamentals"
                />
              </AdminField>

              <AdminField label="Slug" className="md:col-span-2">
                <input
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  className={adminInputClassName}
                  placeholder="sql-fundamentals"
                />
              </AdminField>

              <AdminField label="Description" className="md:col-span-2">
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                  className={adminTextareaClassName}
                  placeholder="Describe who this course is for and what they will build."
                />
              </AdminField>

              <AdminField label="Instructor">
                <select
                  value={instructorId}
                  onChange={(event) => setInstructorId(event.target.value)}
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
                    value={coverImageAssetId}
                    onChange={setCoverImageAssetId}
                    emptyLabel="Use direct image URL instead"
                    buttonLabel="Browse image library"
                  />
                  <AdminMediaAssetUploadButton
                    kind="image"
                    onUploaded={(asset) => {
                      setCoverImageAssetId(asset.id);
                      setCoverImageUrl('');
                    }}
                  />
                </div>
              </AdminField>

              <AdminField label="Cover Image URL" className="md:col-span-2">
                <input
                  value={coverImageUrl}
                  onChange={(event) => setCoverImageUrl(event.target.value)}
                  className={adminInputClassName}
                  placeholder="https://... or data:image/svg+xml,..."
                />
              </AdminField>

              <AdminField label="Intro Video Asset">
                <div className="space-y-3">
                  <AdminMediaAssetPicker
                    kind="video"
                    assets={videoAssets}
                    value={introVideoAssetId}
                    onChange={setIntroVideoAssetId}
                    emptyLabel="Use direct video URL instead"
                    buttonLabel="Browse video library"
                  />
                  <AdminMediaAssetUploadButton
                    kind="video"
                    onUploaded={(asset) => {
                      setIntroVideoAssetId(asset.id);
                      setIntroVideoUrl('');
                    }}
                  />
                </div>
              </AdminField>

              <AdminField label="Course Intro Video URL" className="md:col-span-2">
                <input
                  value={introVideoUrl}
                  onChange={(event) => setIntroVideoUrl(event.target.value)}
                  className={adminInputClassName}
                  placeholder="https://... or http://localhost:11434/video.mp4"
                />
              </AdminField>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <AdminField label="Difficulty">
                <select
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(event.target.value as 'beginner' | 'intermediate' | 'advanced')
                  }
                  className={adminSelectClassName}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </AdminField>

              <AdminField label="Estimated Minutes">
                <input
                  value={estimatedMinutes}
                  onChange={(event) => setEstimatedMinutes(event.target.value)}
                  className={adminInputClassName}
                  placeholder="90"
                />
              </AdminField>

              <AdminField label="Tags" className="xl:col-span-2">
                <input
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  className={adminInputClassName}
                  placeholder="sql, joins, analytics"
                />
              </AdminField>
            </div>
          </div>

          <div className="space-y-5">
            <AdminField label="Publishing State">
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as 'draft' | 'published' | 'archived')
                }
                className={adminSelectClassName}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </AdminField>

            <div className="rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
                Module Unlocking
              </div>
              <label className="mt-4 flex items-start gap-3 text-sm text-[var(--site-muted)]">
                <input
                  type="checkbox"
                  checked={requiresSequentialModules}
                  onChange={(event) => setRequiresSequentialModules(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20"
                />
                <span>
                  Require learners to finish each module and pass its checkpoint before the next one unlocks.
                </span>
              </label>
            </div>

            <div className="rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
                Linked Skills
              </div>
              {skills.isLoading ? (
                <div className="mt-4 text-sm text-[var(--site-muted)]">Loading skills...</div>
              ) : skills.isError ? (
                <div className="mt-4 text-sm text-[var(--site-muted)]">
                  {skills.error instanceof Error
                    ? skills.error.message
                    : 'Failed to load skills'}
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-3">
                  {(skills.data ?? []).map((skill) => {
                    const checked = skillIds.includes(skill.id);
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() =>
                          setSkillIds((ids) =>
                            checked ? ids.filter((value) => value !== skill.id) : [...ids, skill.id],
                          )
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
            </div>

            {instructors.isError || mediaAssets.isError ? (
              <div className="rounded-[1.4rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-4 text-sm text-[var(--site-danger)]">
                {instructors.error instanceof Error
                  ? instructors.error.message
                  : mediaAssets.error instanceof Error
                    ? mediaAssets.error.message
                    : 'Failed to load related content records.'}
              </div>
            ) : null}

            <div className="rounded-[1.4rem] border border-primary/15 bg-primary/10 p-5">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Ready to publish
              </div>
              <div className="mt-3 text-lg leading-8 text-[var(--site-text)]">
                Your new course will open directly in the editor after creation so you can add modules
                and lessons immediately.
              </div>
              <div className="mt-4">
                <AdminStatusPill tone={statusTone(status)}>{status.toUpperCase()}</AdminStatusPill>
              </div>
            </div>

            <CourseLinkedAssetsPanel
              instructor={selectedInstructor}
              coverAsset={selectedCoverAsset}
              coverImageUrl={coverImageUrl}
              introVideoAsset={selectedIntroVideoAsset}
              introVideoUrl={introVideoUrl}
            />

            <button
              type="button"
              onClick={() => create.mutate()}
              disabled={createDisabled}
              className="inline-flex h-16 w-full items-center justify-center gap-2 rounded-[1.2rem] bg-primary px-6 text-lg font-semibold text-primary-foreground shadow-[0_18px_34px_rgba(249,115,22,0.24)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Plus className="h-5 w-5" />
              {create.isPending ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </div>

        {create.isError ? (
          <div className="mt-5 rounded-[1.2rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
            {create.error instanceof Error ? create.error.message : 'Create failed'}
          </div>
        ) : null}
      </AdminSurface>
    </main>
  );
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function statusTone(status: string) {
  if (status === 'published') return 'emerald' as const;
  if (status === 'archived') return 'slate' as const;
  return 'orange' as const;
}
