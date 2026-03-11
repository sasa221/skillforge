'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminApi } from '@/lib/api/endpoints';

export default function NewCoursePage() {
  const router = useRouter();
  const skills = useQuery({ queryKey: ['admin', 'skills'], queryFn: adminApi.skills.list });

  const [title, setTitle] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [difficulty, setDifficulty] = React.useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [estimatedMinutes, setEstimatedMinutes] = React.useState<string>('');
  const [tags, setTags] = React.useState('');
  const [status, setStatus] = React.useState<'draft' | 'published' | 'archived'>('draft');
  const [skillIds, setSkillIds] = React.useState<string[]>([]);

  const create = useMutation({
    mutationFn: async () =>
      adminApi.courses.create({
        title,
        slug,
        description,
        difficulty,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        status,
        skillIds,
      }),
    onSuccess: (course) => router.push(`/admin/courses/${course.id}/edit`),
  });

  return (
    <main className="container py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Create course</h1>
      <p className="mt-2 text-muted-foreground">Create a new course and save it as draft or publish.</p>

      <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="sql-fundamentals" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
            >
              <option value="beginner">beginner</option>
              <option value="intermediate">intermediate</option>
              <option value="advanced">advanced</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Estimated minutes</Label>
            <Input value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value)} placeholder="60" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Tags (comma-separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="sql, data" />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Skills</Label>
            {skills.isLoading ? (
              <div className="text-sm text-muted-foreground">Loading skills…</div>
            ) : skills.isError ? (
              <div className="text-sm text-muted-foreground">
                {skills.error instanceof Error ? skills.error.message : 'Failed to load skills'}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(skills.data ?? []).map((s) => {
                  const checked = skillIds.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSkillIds((ids) =>
                            checked ? ids.filter((x) => x !== s.id) : [...ids, s.id],
                          )
                        }
                      />
                      <span>{s.title}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-end">
            <Button onClick={() => create.mutate()} disabled={create.isPending || !title.trim() || !slug.trim()}>
              {create.isPending ? 'Creating…' : 'Create course'}
            </Button>
          </div>
        </div>

        {create.isError ? (
          <div className="mt-3 rounded-md border bg-muted p-3 text-sm">
            {create.error instanceof Error ? create.error.message : 'Create failed'}
          </div>
        ) : null}
      </div>
    </main>
  );
}

