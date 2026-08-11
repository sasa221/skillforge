'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Sparkles, Users } from 'lucide-react';

import { AdminMediaAssetPicker } from '@/components/admin/AdminMediaAssetPicker';
import { AdminMediaAssetUploadButton } from '@/components/admin/AdminMediaAssetUploadButton';
import { AdminPageIntro, AdminStatusPill, AdminSurface } from '@/components/admin/AdminUi';
import { adminApi } from '@/lib/api/endpoints';
import { resolveInstructorAvatarUrl, resolveMediaUrl } from '@/lib/content/media';

export default function AdminInstructorsPage() {
  const queryClient = useQueryClient();
  const formRef = React.useRef<HTMLElement | null>(null);
  const instructorsQuery = useQuery({
    queryKey: ['admin', 'instructors'],
    queryFn: adminApi.instructors.list,
  });
  const mediaAssetsQuery = useQuery({
    queryKey: ['admin', 'media-assets'],
    queryFn: adminApi.mediaAssets.list,
  });
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', 'instructor-link-options'],
    queryFn: () => adminApi.users(1, 100, 'all'),
  });

  const [fullName, setFullName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [avatarUrl, setAvatarUrl] = React.useState('');
  const [avatarAssetId, setAvatarAssetId] = React.useState('');
  const [userId, setUserId] = React.useState('');
  const [order, setOrder] = React.useState('0');
  const [status, setStatus] = React.useState<'draft' | 'published' | 'archived'>('draft');
  const [searchText, setSearchText] = React.useState('');

  React.useEffect(() => {
    if (!fullName.trim() || slug.trim()) return;
    setSlug(slugify(fullName));
  }, [fullName, slug]);

  const create = useMutation({
    mutationFn: () =>
      adminApi.instructors.create({
        fullName,
        slug,
        title: title || undefined,
        bio: bio || undefined,
        avatarUrl: avatarUrl || undefined,
        avatarAssetId: avatarAssetId || undefined,
        userId: userId || undefined,
        order: order ? Number(order) : undefined,
        status,
      }),
    onSuccess: async () => {
      setFullName('');
      setSlug('');
      setTitle('');
      setBio('');
      setAvatarUrl('');
      setAvatarAssetId('');
      setUserId('');
      setOrder('0');
      setStatus('draft');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
    },
  });

  const update = useMutation({
    mutationFn: (input: { id: string; patch: Record<string, unknown> }) =>
      adminApi.instructors.update(input.id, input.patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.instructors.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'instructors'] });
    },
  });

  const instructors = instructorsQuery.data ?? [];
  const imageAssets = (mediaAssetsQuery.data ?? []).filter((asset) => asset.type === 'image');
  const userOptions = usersQuery.data?.items ?? [];
  const selectedAvatarAsset = imageAssets.find((asset) => asset.id === avatarAssetId) ?? null;
  const selectedAvatarUrl = resolveMediaUrl(selectedAvatarAsset, avatarUrl);
  const filteredInstructors = instructors.filter((instructor) => {
    const haystack = [
      instructor.fullName,
      instructor.slug,
      instructor.title ?? '',
      instructor.bio ?? '',
      instructor.linkedUser?.fullName ?? '',
      instructor.linkedUser?.email ?? '',
      ...(instructor.linkedUser?.roles ?? []),
      ...(instructor.courses ?? []).map((course) => course.title),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(searchText.toLowerCase());
  });

  const createDisabled = create.isPending || !fullName.trim() || !slug.trim();

  return (
    <main className="space-y-6">
      <AdminPageIntro
        title="Manage Instructors"
        description="Create the instructor records that power course bios, hero sections, and teaching identity."
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
              New Instructor
            </button>
          </>
        }
      />

      <AdminSurface ref={formRef}>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-4xl font-semibold text-[var(--site-text)]">Create Instructor</h2>
            <p className="mt-2 text-lg text-[var(--site-muted)]">
              Add the people behind your courses so the catalog and course pages feel grounded.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-2">
          <Field label="Full Name">
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Dr. Sarah Chen"
              className={inputClassName}
            />
          </Field>

          <Field label="Slug">
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="dr-sarah-chen"
              className={inputClassName}
            />
          </Field>

          <Field label="Role / Title">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Senior Data Instructor"
              className={inputClassName}
            />
          </Field>

          <Field label="Avatar URL">
            <input
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://... or uploaded asset fallback"
              className={inputClassName}
            />
          </Field>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
          <Field label="Linked User Account">
            <select
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              className={inputClassName}
            >
              <option value="">Create profile without linked login</option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {formatUserOptionLabel(user)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Access">
            <div className="rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-4 text-sm leading-7 text-[var(--site-muted)]">
              {userId
                ? 'This account will receive instructor workspace access after you save this profile.'
                : 'Leave this empty if you only need a public instructor profile for now.'}
            </div>
          </Field>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
          <Field label="Avatar Image Asset">
            <div className="space-y-3">
              <AdminMediaAssetPicker
                kind="image"
                assets={imageAssets}
                value={avatarAssetId}
                onChange={setAvatarAssetId}
                emptyLabel="Use direct avatar URL instead"
                buttonLabel="Browse avatar library"
              />
              <AdminMediaAssetUploadButton
                kind="image"
                onUploaded={(asset) => {
                  setAvatarAssetId(asset.id);
                  setAvatarUrl('');
                }}
              />
            </div>
          </Field>

          <Field label="Avatar Preview">
            <div className="flex min-h-[92px] items-center gap-4 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] text-lg font-semibold text-[var(--site-primary)]">
                {selectedAvatarUrl ? (
                  <img
                    src={selectedAvatarUrl}
                    alt={fullName || selectedAvatarAsset?.title || 'Instructor avatar preview'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(fullName || 'Instructor')
                )}
              </div>
              <div className="min-w-0 text-sm leading-6 text-[var(--site-muted)]">
                {selectedAvatarAsset
                  ? `Using media asset: ${selectedAvatarAsset.title}`
                  : avatarUrl
                    ? 'Using direct avatar URL'
                    : 'Choose an image asset or paste a direct avatar URL.'}
              </div>
            </div>
          </Field>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
          <Field label="Bio">
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={5}
              placeholder="Short teaching bio, focus areas, and what learners can expect."
              className={textareaClassName}
            />
          </Field>

          <Field label="Order">
            <input
              value={order}
              onChange={(event) => setOrder(event.target.value)}
              placeholder="0"
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

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => create.mutate()}
            disabled={createDisabled}
            className="inline-flex h-16 items-center justify-center rounded-[1.2rem] bg-primary px-8 text-lg font-semibold text-primary-foreground shadow-[0_18px_34px_rgba(249,115,22,0.24)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {create.isPending ? 'Creating...' : 'Add Instructor'}
          </button>
          <AdminStatusPill tone={statusTone(status)}>{status.toUpperCase()}</AdminStatusPill>
        </div>

        {create.isError ? (
          <div className="mt-5 rounded-[1.2rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
            {create.error instanceof Error ? create.error.message : 'Create failed'}
          </div>
        ) : null}
      </AdminSurface>

      <AdminSurface>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-4xl font-semibold text-[var(--site-text)]">Instructor Library</h2>
            <p className="mt-2 text-lg text-[var(--site-muted)]">
              Showing {filteredInstructors.length} instructor record{filteredInstructors.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Filter name, slug, or bio..."
              className="w-72 bg-transparent text-base text-[var(--site-text)] outline-none placeholder:text-[var(--site-subtle)]"
            />
          </div>
        </div>

        {instructorsQuery.isLoading ? (
          <div className="mt-6 text-lg text-[var(--site-muted)]">Loading instructors...</div>
        ) : instructorsQuery.isError ? (
          <div className="mt-6 text-lg text-[var(--site-muted)]">
            {instructorsQuery.error instanceof Error
              ? instructorsQuery.error.message
              : 'Failed to load instructors'}
          </div>
        ) : filteredInstructors.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-6 text-lg text-[var(--site-muted)]">
            No instructors match the current filter.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filteredInstructors.map((instructor) => (
              <div
                key={instructor.id}
                className="rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5"
              >
                <div className="flex flex-wrap items-start gap-5">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] text-lg font-semibold text-[var(--site-primary)]">
                    {resolveInstructorAvatarUrl(instructor) ? (
                      <img
                        src={resolveInstructorAvatarUrl(instructor)!}
                        alt={instructor.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(instructor.fullName)
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <AdminStatusPill tone={(instructor.courses?.length ?? 0) > 0 ? 'blue' : 'slate'}>
                        {(instructor.courses?.length ?? 0) > 0
                          ? `${instructor.courses.length} linked course${instructor.courses.length === 1 ? '' : 's'}`
                          : 'No linked courses'}
                      </AdminStatusPill>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_240px_220px]">
                      <input
                        defaultValue={instructor.fullName}
                        onBlur={(event) =>
                          event.target.value.trim() !== instructor.fullName &&
                          update.mutate({
                            id: instructor.id,
                            patch: { fullName: event.target.value.trim() },
                          })
                        }
                        className="rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-xl font-semibold text-[var(--site-text)] outline-none"
                      />

                      <input
                        defaultValue={instructor.title ?? ''}
                        onBlur={(event) =>
                          event.target.value !== (instructor.title ?? '') &&
                          update.mutate({
                            id: instructor.id,
                            patch: { title: event.target.value || null },
                          })
                        }
                        placeholder="Role / title"
                        className={inputClassName}
                      />

                      <div className="flex items-center gap-3">
                        {instructor.status === 'published' ? (
                          <Link
                            href={`/instructors/${instructor.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-12 shrink-0 items-center justify-center rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
                          >
                            View public profile
                          </Link>
                        ) : null}
                        <select
                          defaultValue={instructor.status}
                          onChange={(event) =>
                            update.mutate({
                              id: instructor.id,
                              patch: { status: event.target.value },
                            })
                          }
                          className={inputClassName}
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                        <AdminStatusPill tone={statusTone(instructor.status)}>
                          {instructor.status.toUpperCase()}
                        </AdminStatusPill>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_130px]">
                      <input
                        defaultValue={instructor.slug}
                        onBlur={(event) =>
                          event.target.value.trim() !== instructor.slug &&
                          update.mutate({
                            id: instructor.id,
                            patch: { slug: event.target.value.trim() },
                          })
                        }
                        className="rounded-[1rem] border border-primary/10 bg-primary/10 px-4 py-3 font-mono text-base text-primary outline-none"
                      />

                      <input
                        defaultValue={instructor.avatarUrl ?? ''}
                        onBlur={(event) =>
                          event.target.value !== (instructor.avatarUrl ?? '') &&
                          update.mutate({
                            id: instructor.id,
                            patch: { avatarUrl: event.target.value || null },
                          })
                        }
                        placeholder="Avatar URL fallback"
                        className={inputClassName}
                      />

                      <input
                        defaultValue={String(instructor.order)}
                        onBlur={(event) =>
                          event.target.value !== String(instructor.order) &&
                          update.mutate({
                            id: instructor.id,
                            patch: { order: Number(event.target.value || '0') },
                          })
                        }
                        placeholder="Order"
                        className={inputClassName}
                      />
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-4 text-sm leading-7 text-[var(--site-muted)]">
                        <div className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--site-subtle)]">
                          Linked user access
                        </div>
                        {instructor.linkedUser ? (
                          <div className="space-y-1">
                            <div className="font-medium text-[var(--site-text)]">
                              {instructor.linkedUser.fullName ?? instructor.linkedUser.email}
                            </div>
                            <div>{instructor.linkedUser.email}</div>
                            <div className="text-[var(--site-subtle)]">
                              Roles: {instructor.linkedUser.roles.map(roleLabel).join(', ')}
                            </div>
                          </div>
                        ) : (
                          'No login account linked to this instructor yet.'
                        )}
                      </div>

                      <Field label="Linked User Account">
                        <select
                          value={instructor.linkedUser?.id ?? ''}
                          onChange={(event) =>
                            update.mutate({
                              id: instructor.id,
                              patch: { userId: event.target.value },
                            })
                          }
                          className={inputClassName}
                        >
                          <option value="">No linked login</option>
                          {userOptions.map((user) => (
                            <option key={user.id} value={user.id}>
                              {formatUserOptionLabel(user)}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
                      <div className="space-y-3">
                        <AdminMediaAssetPicker
                          kind="image"
                          assets={imageAssets}
                          value={instructor.avatarAssetId ?? ''}
                          onChange={(id) =>
                            update.mutate({
                              id: instructor.id,
                              patch: { avatarAssetId: id || null },
                            })
                          }
                          emptyLabel="Use direct avatar URL instead"
                          buttonLabel="Browse avatar library"
                        />
                        <AdminMediaAssetUploadButton
                          kind="image"
                          onUploaded={(asset) =>
                            update.mutate({
                              id: instructor.id,
                              patch: {
                                avatarAssetId: asset.id,
                                avatarUrl: null,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm leading-7 text-[var(--site-muted)]">
                        {instructor.avatarAsset
                          ? `Using media asset: ${instructor.avatarAsset.title}`
                          : instructor.avatarUrl
                            ? 'Using direct avatar URL fallback'
                            : 'No avatar image selected yet.'}
                      </div>
                    </div>

                    <textarea
                      defaultValue={instructor.bio ?? ''}
                      rows={3}
                      onBlur={(event) =>
                        event.target.value !== (instructor.bio ?? '') &&
                        update.mutate({
                          id: instructor.id,
                          patch: { bio: event.target.value || null },
                        })
                      }
                      placeholder="Instructor bio"
                      className={textareaClassName}
                    />

                    <div className="rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-4">
                      <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--site-subtle)]">
                        Linked courses
                      </div>
                      {instructor.courses.length ? (
                        <div className="space-y-2">
                          {instructor.courses.map((course) => (
                            <Link
                              key={course.id}
                              href={`/admin/courses/${course.id}/edit`}
                              className="flex items-center justify-between gap-3 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-3 py-2 text-sm transition hover:bg-[var(--site-primary-soft)]"
                            >
                              <span className="min-w-0">
                                <span className="block truncate font-medium text-[var(--site-text)]">
                                  {course.title}
                                </span>
                                <span className="block truncate text-[var(--site-subtle)]">
                                  {course.slug}
                                </span>
                              </span>
                              <span className="shrink-0 text-[var(--site-primary)]">Open</span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm leading-7 text-[var(--site-muted)]">
                          This instructor is not linked to any course yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove.mutate(instructor.id)}
                    disabled={remove.isPending || instructor.courses.length > 0}
                    className="rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm font-semibold text-[var(--site-muted)] transition hover:bg-[var(--site-primary-soft)] hover:text-[var(--site-text)] disabled:opacity-60"
                  >
                    {instructor.courses.length > 0 ? 'Linked' : 'Archive'}
                  </button>
                </div>
              </div>
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

const textareaClassName =
  'min-h-[110px] w-full rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-4 text-base text-[var(--site-text)] outline-none transition placeholder:text-[var(--site-subtle)] focus:border-primary/35';

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function statusTone(status: string) {
  if (status === 'published') return 'emerald' as const;
  if (status === 'archived') return 'slate' as const;
  return 'orange' as const;
}

function roleLabel(role: string) {
  if (role === 'instructor') return 'Instructor';
  if (role === 'content_manager') return 'Content Manager';
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'student') return 'Student';
  if (role === 'admin') return 'Admin';
  if (role === 'all') return 'All Roles';
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatUserOptionLabel(user: {
  id: string;
  email: string;
  roles: string[];
  profile: null | { fullName: string };
}) {
  const displayName = user.profile?.fullName ?? user.email;
  const roles = user.roles.length ? ` - ${user.roles.map(roleLabel).join(', ')}` : '';
  return `${displayName} (${user.email})${roles}`;
}
