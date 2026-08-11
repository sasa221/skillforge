'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Sparkles, Wrench } from 'lucide-react';

import { AdminPageIntro, AdminStatusPill, AdminSurface } from '@/components/admin/AdminUi';
import { adminApi } from '@/lib/api/endpoints';

export default function AdminSkillsPage() {
  const qc = useQueryClient();
  const formRef = React.useRef<HTMLElement | null>(null);
  const skillsQuery = useQuery({ queryKey: ['admin', 'skills'], queryFn: adminApi.skills.list });

  const [title, setTitle] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [status, setStatus] = React.useState<'draft' | 'published' | 'archived'>('draft');
  const [searchText, setSearchText] = React.useState('');

  const create = useMutation({
    mutationFn: () => adminApi.skills.create({ title, slug, description, status }),
    onSuccess: async () => {
      setTitle('');
      setSlug('');
      setDescription('');
      setStatus('draft');
      await qc.invalidateQueries({ queryKey: ['admin', 'skills'] });
    },
  });

  const update = useMutation({
    mutationFn: (input: { id: string; patch: Record<string, unknown> }) =>
      adminApi.skills.update(input.id, input.patch),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['admin', 'skills'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.skills.remove(id),
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['admin', 'skills'] }),
  });

  React.useEffect(() => {
    if (!title.trim()) return;
    if (!slug.trim()) {
      setSlug(slugify(title));
    }
  }, [slug, title]);

  const skills = skillsQuery.data ?? [];
  const filteredSkills = skills.filter((skill) => {
    const haystack = `${skill.title} ${skill.slug} ${skill.description ?? ''}`.toLowerCase();
    return haystack.includes(searchText.toLowerCase());
  });

  const createDisabled = create.isPending || !title.trim() || !slug.trim();

  return (
    <main className="space-y-6">
      <AdminPageIntro
        title="Manage Skills"
        description="Define and organize the core competency matrix for learners."
        actions={
          <>
            <Link
              href="/admin"
              className="inline-flex h-14 items-center justify-center rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 text-lg font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
            >
              Audit Overview
            </Link>
            <button
              type="button"
              onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.2rem] bg-primary px-5 text-lg font-semibold text-primary-foreground shadow-[0_18px_34px_rgba(249,115,22,0.24)] transition hover:bg-primary/90"
            >
              <Plus className="h-5 w-5" />
              New Category
            </button>
          </>
        }
      />

      <AdminSurface ref={formRef}>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-4xl font-semibold text-[var(--site-text)]">Create New Skill</h2>
            <p className="mt-2 text-lg text-[var(--site-muted)]">
              Add reusable skill buckets for courses, tracks, and curriculum mapping.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-2">
          <label className="space-y-3">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
              Skill Title
            </div>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Advanced SQL Data Modeling"
              className={inputClassName}
            />
          </label>

          <label className="space-y-3">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
              URL Slug
            </div>
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="advanced-sql-data-modeling"
              className={inputClassName}
            />
          </label>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_220px]">
          <label className="space-y-3">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
              Description
            </div>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              placeholder="Brief overview of the skill requirements and learning outcomes..."
              className={textareaClassName}
            />
          </label>

          <div className="space-y-5">
            <label className="block space-y-3">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
                Status
              </div>
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
            </label>

            <button
              type="button"
              onClick={() => create.mutate()}
              disabled={createDisabled}
              className="inline-flex h-16 w-full items-center justify-center rounded-[1.2rem] bg-primary px-6 text-lg font-semibold text-primary-foreground shadow-[0_18px_34px_rgba(249,115,22,0.24)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {create.isPending ? 'Creating...' : 'Add Skill to Library'}
            </button>
          </div>
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
            <h2 className="text-4xl font-semibold text-[var(--site-text)]">Existing Skills</h2>
            <p className="mt-2 text-lg text-[var(--site-muted)]">Showing {filteredSkills.length} skills</p>
          </div>
          <div className="flex items-center gap-3 rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Filter title, slug or description..."
              className="w-72 bg-transparent text-base text-[var(--site-text)] outline-none placeholder:text-[var(--site-subtle)]"
            />
          </div>
        </div>

        {skillsQuery.isLoading ? (
          <div className="mt-6 text-lg text-[var(--site-muted)]">Loading skills...</div>
        ) : skillsQuery.isError ? (
          <div className="mt-6 text-lg text-[var(--site-muted)]">
            {skillsQuery.error instanceof Error ? skillsQuery.error.message : 'Failed to load skills'}
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-6 text-lg text-[var(--site-muted)]">
            No skills match the current filter.
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-[1.6rem] border border-[var(--site-border)]">
            <div className="grid grid-cols-[minmax(0,1.35fr)_240px_220px_160px] bg-[var(--site-surface-alt)] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
              <div>Skill Name</div>
              <div>Slug</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>

            <div className="divide-y divide-[var(--site-border)]">
              {filteredSkills.map((skill, index) => (
                <div
                  key={skill.id}
                  className="grid grid-cols-[minmax(0,1.35fr)_240px_220px_160px] items-center gap-4 px-6 py-5"
                >
                    <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-surface-alt)] text-lg font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <input
                        defaultValue={skill.title}
                        onBlur={(event) =>
                          event.target.value.trim() !== skill.title &&
                          update.mutate({ id: skill.id, patch: { title: event.target.value.trim() } })
                        }
                        className="w-full bg-transparent text-2xl font-semibold text-[var(--site-text)] outline-none"
                      />
                      <textarea
                        defaultValue={skill.description ?? ''}
                        rows={2}
                        onBlur={(event) =>
                          event.target.value !== (skill.description ?? '') &&
                          update.mutate({ id: skill.id, patch: { description: event.target.value } })
                        }
                        className="mt-2 w-full resize-none bg-transparent text-sm leading-7 text-[var(--site-muted)] outline-none"
                      />
                    </div>
                  </div>

                  <input
                    defaultValue={skill.slug}
                    onBlur={(event) =>
                      event.target.value.trim() !== skill.slug &&
                      update.mutate({ id: skill.id, patch: { slug: event.target.value.trim() } })
                    }
                    className="rounded-[1rem] border border-primary/10 bg-primary/10 px-4 py-3 font-mono text-lg text-primary outline-none"
                  />

                  <div className="flex items-center gap-3">
                    <select
                      defaultValue={skill.status}
                      onChange={(event) => update.mutate({ id: skill.id, patch: { status: event.target.value } })}
                      className={inputClassName}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                    <AdminStatusPill tone={statusTone(skill.status)}>
                      {skill.status.toUpperCase()}
                    </AdminStatusPill>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => remove.mutate(skill.id)}
                      disabled={remove.isPending}
                      className="rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3 text-sm font-semibold text-[var(--site-muted)] transition hover:bg-[var(--site-primary-soft)] hover:text-[var(--site-text)] disabled:opacity-60"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(update.isError || remove.isError) ? (
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

const inputClassName =
  'h-14 w-full rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-base text-[var(--site-text)] outline-none transition placeholder:text-[var(--site-subtle)] focus:border-primary/35';

const textareaClassName =
  'min-h-[150px] w-full rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-4 text-base text-[var(--site-text)] outline-none transition placeholder:text-[var(--site-subtle)] focus:border-primary/35';

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
