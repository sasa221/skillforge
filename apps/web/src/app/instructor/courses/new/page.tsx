'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { AdminSurface } from '@/components/admin/AdminUi';
import { instructorWorkspaceApi } from '@/lib/api/endpoints';
import { headingFont } from '@/lib/fonts';
import { cn } from '@/lib/utils';

export default function CreateCoursePage() {
  const router = useRouter();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [level, setLevel] = React.useState('beginner');
  const [error, setError] = React.useState('');

  const createMutation = useMutation({
    mutationFn: instructorWorkspaceApi.createCourse,
    onSuccess: () => {
      router.push('/instructor');
    },
    onError: (err: any) => {
      setError(err?.message || 'Failed to create course');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    createMutation.mutate({ title, description, level });
  };

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <div className="mb-6">
        <Link
          href="/instructor"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-muted)] transition hover:text-[var(--site-text)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workspace
        </Link>
      </div>

      <AdminSurface>
        <div className="mb-8">
          <h1
            className={cn(
              'text-4xl font-extrabold tracking-tight text-[var(--site-text)]',
              headingFont.className,
            )}
          >
            Create New Course
          </h1>
          <p className="mt-3 text-lg text-[var(--site-muted)]">
            Start a new draft course. You can add modules, lessons, and media later.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-[1rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-4 text-sm font-semibold text-[var(--site-danger)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-semibold text-[var(--site-text)]">
              Course Title <span className="text-[var(--site-danger)]">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Advanced React Patterns"
              className="w-full rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3 text-[var(--site-text)] placeholder:text-[var(--site-muted)] focus:border-[var(--site-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--site-primary)]"
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-[var(--site-text)]"
            >
              Description <span className="text-[var(--site-subtle)]">(Optional)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief overview of what students will learn..."
              rows={4}
              className="w-full rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3 text-[var(--site-text)] placeholder:text-[var(--site-muted)] focus:border-[var(--site-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--site-primary)]"
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="level" className="block text-sm font-semibold text-[var(--site-text)]">
              Difficulty Level
            </label>
            <select
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3 text-[var(--site-text)] focus:border-[var(--site-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--site-primary)]"
              disabled={createMutation.isPending}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            <Link
              href="/instructor"
              className="inline-flex h-12 items-center justify-center rounded-[1rem] px-5 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-alt)]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex h-12 items-center justify-center rounded-[1rem] bg-[var(--site-primary)] px-6 text-sm font-semibold text-[var(--site-surface)] shadow-[0_12px_24px_rgba(249,115,22,0.2)] transition hover:bg-[var(--site-primary)]/90 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </AdminSurface>
    </main>
  );
}
