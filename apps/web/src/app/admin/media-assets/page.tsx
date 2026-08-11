'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Film, ImageIcon, Link2, Plus, Sparkles, Upload } from 'lucide-react';

import { AdminPageIntro, AdminStatusPill, AdminSurface } from '@/components/admin/AdminUi';
import { adminApi } from '@/lib/api/endpoints';
import { MediaVideoFrame } from '@/components/site/MediaVideoFrame';

export default function AdminMediaAssetsPage() {
  const queryClient = useQueryClient();
  const formRef = React.useRef<HTMLElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const assetsQuery = useQuery({
    queryKey: ['admin', 'media-assets'],
    queryFn: adminApi.mediaAssets.list,
  });

  const [title, setTitle] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [altText, setAltText] = React.useState('');
  const [mimeType, setMimeType] = React.useState('');
  const [durationSeconds, setDurationSeconds] = React.useState('');
  const [type, setType] = React.useState<'image' | 'video' | 'file'>('image');
  const [sourceType, setSourceType] = React.useState<'external' | 'upload' | 'generated'>(
    'external',
  );
  const [status, setStatus] = React.useState<'draft' | 'published' | 'archived'>('draft');
  const [searchText, setSearchText] = React.useState('');
  const [filterType, setFilterType] = React.useState<'all' | 'image' | 'video' | 'file'>('all');
  const [filterUsage, setFilterUsage] = React.useState<'all' | 'in-use' | 'unlinked'>('all');
  const [filterStatus, setFilterStatus] = React.useState<
    'all' | 'draft' | 'published' | 'archived'
  >('all');
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);

  const create = useMutation({
    mutationFn: () =>
      adminApi.mediaAssets.create({
        title,
        url,
        altText: altText || undefined,
        mimeType: mimeType || undefined,
        durationSeconds: durationSeconds ? Number(durationSeconds) : undefined,
        type,
        sourceType,
        status,
      }),
    onSuccess: async () => {
      setTitle('');
      setUrl('');
      setAltText('');
      setMimeType('');
      setDurationSeconds('');
      setType('image');
      setSourceType('external');
      setStatus('draft');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'media-assets'] });
    },
  });

  const update = useMutation({
    mutationFn: (input: { id: string; patch: Record<string, unknown> }) =>
      adminApi.mediaAssets.update(input.id, input.patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'media-assets'] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.mediaAssets.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'media-assets'] });
    },
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error('Choose a file to upload first.');
      return adminApi.mediaAssets.upload({
        file: uploadFile,
        title: title || undefined,
        altText: altText || undefined,
        status,
      });
    },
    onSuccess: async () => {
      setTitle('');
      setUrl('');
      setAltText('');
      setMimeType('');
      setDurationSeconds('');
      setType('image');
      setSourceType('external');
      setStatus('draft');
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await queryClient.invalidateQueries({ queryKey: ['admin', 'media-assets'] });
    },
  });

  const assets = assetsQuery.data ?? [];
  const filteredAssets = assets.filter((asset) => {
    if (filterType !== 'all' && asset.type !== filterType) return false;
    if (filterStatus !== 'all' && asset.status !== filterStatus) return false;

    const totalLinks = asset.usage?.totalLinks ?? 0;
    if (filterUsage === 'in-use' && totalLinks === 0) return false;
    if (filterUsage === 'unlinked' && totalLinks > 0) return false;

    const haystack = [
      asset.title,
      asset.url,
      asset.altText ?? '',
      asset.mimeType ?? '',
      asset.type,
      asset.sourceType,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(searchText.toLowerCase());
  });
  const linkedCount = assets.filter((asset) => (asset.usage?.totalLinks ?? 0) > 0).length;
  const videoCount = assets.filter((asset) => asset.type === 'video').length;
  const imageCount = assets.filter((asset) => asset.type === 'image').length;

  const createDisabled = create.isPending || !title.trim() || !url.trim();
  const uploadDisabled = upload.isPending || !uploadFile;

  return (
    <main className="space-y-6">
      <AdminPageIntro
        title="Manage Media Assets"
        description="Store reusable image and video records that courses and modules can reference directly from the database."
        actions={
          <>
            <Link
              href="/admin"
              className="inline-flex h-14 items-center justify-center rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 text-lg font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
            >
              Back to Overview
            </Link>
            <button
              type="button"
              onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.2rem] bg-primary px-5 text-lg font-semibold text-primary-foreground shadow-[0_18px_34px_rgba(249,115,22,0.24)] transition hover:bg-primary/90"
            >
              <Plus className="h-5 w-5" />
              New Asset
            </button>
          </>
        }
      />

      <AdminSurface ref={formRef}>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-4xl font-semibold text-[var(--site-text)]">Create Media Asset</h2>
            <p className="mt-2 text-lg text-[var(--site-muted)]">
              Save image and video references once, then reuse them across courses and modules.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-2">
          <Field label="Asset Title">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Excel Foundations cover"
              className={inputClassName}
            />
          </Field>

          <Field label="Source URL">
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://... or /uploads/..."
              className={inputClassName}
            />
          </Field>

          <Field label="Alt Text">
            <input
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              placeholder="Learners collaborating around a laptop"
              className={inputClassName}
            />
          </Field>

          <Field label="Mime Type">
            <input
              value={mimeType}
              onChange={(event) => setMimeType(event.target.value)}
              placeholder="image/svg+xml or video/mp4"
              className={inputClassName}
            />
          </Field>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-4">
          <Field label="Type">
            <select
              value={type}
              onChange={(event) => setType(event.target.value as 'image' | 'video' | 'file')}
              className={inputClassName}
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="file">File</option>
            </select>
          </Field>

          <Field label="Source Type">
            <select
              value={sourceType}
              onChange={(event) =>
                setSourceType(event.target.value as 'external' | 'upload' | 'generated')
              }
              className={inputClassName}
            >
              <option value="external">External</option>
              <option value="upload">Upload</option>
              <option value="generated">Generated</option>
            </select>
          </Field>

          <Field label="Duration (seconds)">
            <input
              value={durationSeconds}
              onChange={(event) => setDurationSeconds(event.target.value)}
              placeholder="90"
              className={inputClassName}
            />
          </Field>

          <Field label="Status">
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as 'draft' | 'published' | 'archived')
              }
              className={inputClassName}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
        </div>

        <div className="mt-5 rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
                Upload from device
              </div>
              <div className="mt-2 max-w-[720px] text-sm leading-7 text-[var(--site-muted)]">
                Choose an image, video, or file from your machine. We will store the uploaded URL in the database and add it to the shared media library automatically.
              </div>
            </div>
            {uploadFile ? (
              <div className="rounded-full bg-[var(--site-primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--site-primary)]">
                {uploadFile.name}
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf,.zip,.doc,.docx,.ppt,.pptx"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setUploadFile(file);
              }}
              className="block min-w-[280px] rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3 text-sm text-[var(--site-muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--site-primary)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            <button
              type="button"
              onClick={() => upload.mutate()}
              disabled={uploadDisabled}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.2rem] bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[0_18px_34px_rgba(249,115,22,0.24)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Upload className="h-4 w-4" />
              {upload.isPending ? 'Uploading...' : 'Upload and save asset'}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => create.mutate()}
            disabled={createDisabled}
            className="inline-flex h-16 items-center justify-center rounded-[1.2rem] bg-primary px-8 text-lg font-semibold text-primary-foreground shadow-[0_18px_34px_rgba(249,115,22,0.24)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {create.isPending ? 'Creating...' : 'Add Asset'}
          </button>
          <AdminStatusPill tone={statusTone(status)}>{status.toUpperCase()}</AdminStatusPill>
        </div>

        {create.isError || upload.isError ? (
          <div className="mt-5 rounded-[1.2rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
            {create.error instanceof Error
              ? create.error.message
              : upload.error instanceof Error
                ? upload.error.message
                : 'Media asset action failed'}
          </div>
        ) : null}
      </AdminSurface>

      <AdminSurface>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-4xl font-semibold text-[var(--site-text)]">Asset Library</h2>
            <p className="mt-2 text-lg text-[var(--site-muted)]">
              Showing {filteredAssets.length} media record{filteredAssets.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Filter title, URL, or type..."
                className="w-72 bg-transparent text-base text-[var(--site-text)] outline-none placeholder:text-[var(--site-subtle)]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <FilterChip
                active={filterUsage === 'all'}
                onClick={() => setFilterUsage('all')}
                label={`All (${assets.length})`}
              />
              <FilterChip
                active={filterUsage === 'in-use'}
                onClick={() => setFilterUsage('in-use')}
                label={`In use (${linkedCount})`}
              />
              <FilterChip
                active={filterUsage === 'unlinked'}
                onClick={() => setFilterUsage('unlinked')}
                label={`Unlinked (${assets.length - linkedCount})`}
              />
              <FilterChip
                active={filterType === 'image'}
                onClick={() => setFilterType((current) => (current === 'image' ? 'all' : 'image'))}
                label={`Images (${imageCount})`}
              />
              <FilterChip
                active={filterType === 'video'}
                onClick={() => setFilterType((current) => (current === 'video' ? 'all' : 'video'))}
                label={`Videos (${videoCount})`}
              />
              <select
                value={filterStatus}
                onChange={(event) =>
                  setFilterStatus(event.target.value as 'all' | 'draft' | 'published' | 'archived')
                }
                className="h-11 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-sm font-medium text-[var(--site-text)] outline-none"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {assetsQuery.isLoading ? (
          <div className="mt-6 text-lg text-[var(--site-muted)]">Loading assets...</div>
        ) : assetsQuery.isError ? (
          <div className="mt-6 text-lg text-[var(--site-muted)]">
            {assetsQuery.error instanceof Error ? assetsQuery.error.message : 'Failed to load assets'}
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-6 text-lg text-[var(--site-muted)]">
            No assets match the current filter.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredAssets.map((asset) => (
              (() => {
                const usage = asset.usage;
                const totalLinks = usage?.totalLinks ?? 0;
                const assetIsInUse = totalLinks > 0;

                return (
              <div
                key={asset.id}
                className="grid gap-5 rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5 xl:grid-cols-[minmax(0,1.2fr)_320px]"
              >
                <div className="space-y-4">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
                    <input
                      defaultValue={asset.title}
                      onBlur={(event) =>
                        event.target.value.trim() !== asset.title &&
                        update.mutate({
                          id: asset.id,
                          patch: { title: event.target.value.trim() },
                        })
                      }
                      className="rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-xl font-semibold text-[var(--site-text)] outline-none"
                    />

                    <select
                      defaultValue={asset.type}
                      onChange={(event) =>
                        update.mutate({
                          id: asset.id,
                          patch: { type: event.target.value },
                        })
                      }
                      className={inputClassName}
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="file">File</option>
                    </select>

                    <div className="flex items-center gap-3">
                      <select
                        defaultValue={asset.status}
                        onChange={(event) =>
                          update.mutate({
                            id: asset.id,
                            patch: { status: event.target.value },
                          })
                        }
                        className={inputClassName}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                      <AdminStatusPill tone={statusTone(asset.status)}>
                        {asset.status.toUpperCase()}
                      </AdminStatusPill>
                    </div>
                  </div>

                  <input
                    defaultValue={asset.url}
                    onBlur={(event) =>
                      event.target.value.trim() !== asset.url &&
                      update.mutate({
                        id: asset.id,
                        patch: { url: event.target.value.trim() },
                      })
                    }
                    className="rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-base text-[var(--site-text)] outline-none"
                  />

                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_180px]">
                    <input
                      defaultValue={asset.altText ?? ''}
                      onBlur={(event) =>
                        event.target.value !== (asset.altText ?? '') &&
                        update.mutate({
                          id: asset.id,
                          patch: { altText: event.target.value || null },
                        })
                      }
                      placeholder="Alt text"
                      className={inputClassName}
                    />

                    <select
                      defaultValue={asset.sourceType}
                      onChange={(event) =>
                        update.mutate({
                          id: asset.id,
                          patch: { sourceType: event.target.value },
                        })
                      }
                      className={inputClassName}
                    >
                      <option value="external">External</option>
                      <option value="upload">Upload</option>
                      <option value="generated">Generated</option>
                    </select>

                    <input
                      defaultValue={asset.durationSeconds ? String(asset.durationSeconds) : ''}
                      onBlur={(event) =>
                        event.target.value !== String(asset.durationSeconds ?? '') &&
                        update.mutate({
                          id: asset.id,
                          patch: {
                            durationSeconds: event.target.value ? Number(event.target.value) : null,
                          },
                        })
                      }
                      placeholder="Duration"
                      className={inputClassName}
                    />
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
                    <input
                      defaultValue={asset.mimeType ?? ''}
                      onBlur={(event) =>
                        event.target.value !== (asset.mimeType ?? '') &&
                        update.mutate({
                          id: asset.id,
                          patch: { mimeType: event.target.value || null },
                        })
                      }
                      placeholder="Mime type"
                      className={inputClassName}
                    />

                    <button
                      type="button"
                      onClick={() => remove.mutate(asset.id)}
                      disabled={remove.isPending || assetIsInUse}
                      className="rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm font-semibold text-[var(--site-muted)] transition hover:bg-[var(--site-primary-soft)] hover:text-[var(--site-text)] disabled:opacity-60"
                    >
                      {assetIsInUse ? 'Linked' : 'Archive'}
                    </button>
                  </div>

                  <div className="rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--site-subtle)]">
                          Usage
                        </div>
                        <AdminStatusPill tone={assetIsInUse ? 'blue' : 'slate'}>
                          {assetIsInUse ? `${totalLinks} active link${totalLinks === 1 ? '' : 's'}` : 'Unlinked'}
                        </AdminStatusPill>
                      </div>

                      <div className="text-xs text-[var(--site-subtle)]">
                        Uploaded by{' '}
                        <span className="font-semibold text-[var(--site-text)]">
                          {asset.uploadedBy?.fullName || asset.uploadedBy?.email || 'System'}
                        </span>
                      </div>
                    </div>

                    {assetIsInUse ? (
                      <div className="mt-4 space-y-4">
                        {usage?.coverCourses.length ? (
                          <UsageSection
                            title="Course covers"
                            items={usage.coverCourses.map((course) => ({
                              key: course.id,
                              href: `/admin/courses/${course.id}/edit`,
                              label: course.title,
                              meta: course.slug,
                            }))}
                          />
                        ) : null}

                        {usage?.introCourses.length ? (
                          <UsageSection
                            title="Course intro videos"
                            items={usage.introCourses.map((course) => ({
                              key: course.id,
                              href: `/admin/courses/${course.id}/edit`,
                              label: course.title,
                              meta: course.slug,
                            }))}
                          />
                        ) : null}

                        {usage?.introModules.length ? (
                          <UsageSection
                            title="Module intro videos"
                            items={usage.introModules.map((module) => ({
                              key: module.id,
                              href: `/admin/modules/${module.id}/edit`,
                              label: module.title,
                              meta: module.course.title,
                            }))}
                          />
                        ) : null}

                        {usage?.avatarInstructors.length ? (
                          <UsageSection
                            title="Instructor avatars"
                            items={usage.avatarInstructors.map((instructor) => ({
                              key: instructor.id,
                              href: '/admin/instructors',
                              label: instructor.fullName,
                              meta: instructor.slug,
                            }))}
                          />
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
                        This asset is not linked yet. You can safely archive it or reuse it in a course, module, or instructor record.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
                  <div className="mb-4 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--site-subtle)]">
                    {asset.type === 'video' ? (
                      <Film className="h-4 w-4 text-[var(--site-primary)]" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-[var(--site-primary)]" />
                    )}
                    Preview
                  </div>

                  {asset.type === 'image' ? (
                    <div className="overflow-hidden rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]">
                      <img
                        src={asset.url}
                        alt={asset.altText ?? asset.title}
                        className="h-56 w-full object-cover"
                      />
                    </div>
                  ) : asset.type === 'video' ? (
                    <MediaVideoFrame
                      url={asset.url}
                      title={asset.title}
                      caption={asset.durationSeconds ? `${asset.durationSeconds}s video` : undefined}
                    />
                  ) : (
                    <div className="rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4 text-sm leading-7 text-[var(--site-muted)]">
                      <div className="flex items-center gap-2 text-[var(--site-text)]">
                        <Link2 className="h-4 w-4 text-[var(--site-primary)]" />
                        File asset
                      </div>
                      <div className="mt-2 break-all">{asset.url}</div>
                    </div>
                  )}
                </div>
              </div>
                );
              })()
            ))}
          </div>
        )}

        {update.isError || remove.isError ? (
          <div className="mt-5 rounded-[1.2rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
            {update.error instanceof Error
              ? update.error.message
              : remove.error instanceof Error
                ? remove.error.message
                : 'Update failed'}
          </div>
        ) : null}
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

function UsageSection({
  title,
  items,
}: {
  title: string;
  items: Array<{ key: string; href: string; label: string; meta: string }>;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--site-subtle)]">
        {title}
      </div>
      <div className="space-y-2">
        {items.slice(0, 3).map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="flex items-center justify-between gap-3 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-3 py-2 text-sm transition hover:bg-[var(--site-primary-soft)]"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium text-[var(--site-text)]">{item.label}</span>
              <span className="block truncate text-[var(--site-subtle)]">{item.meta}</span>
            </span>
            <span className="shrink-0 text-[var(--site-primary)]">Open</span>
          </Link>
        ))}
        {items.length > 3 ? (
          <div className="text-xs text-[var(--site-subtle)]">
            +{items.length - 3} more linked record{items.length - 3 === 1 ? '' : 's'}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-3">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
        {label}
      </div>
      {children}
    </label>
  );
}

const inputClassName =
  'h-14 w-full rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-base text-[var(--site-text)] outline-none transition placeholder:text-[var(--site-subtle)] focus:border-primary/35';

function statusTone(status: string) {
  if (status === 'published') return 'emerald' as const;
  if (status === 'archived') return 'slate' as const;
  return 'orange' as const;
}
