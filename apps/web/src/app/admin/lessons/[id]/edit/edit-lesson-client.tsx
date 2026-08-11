'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BrainCircuit, Save, Sparkles } from 'lucide-react';

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
import { useToast } from '@/components/toast/toast-provider';
import { adminApi } from '@/lib/api/endpoints';
import type { AdminMediaAsset } from '@/lib/content/types';

function prettyJson(value: any) {
  return JSON.stringify(value, null, 2);
}

function describeLessonBlock(block: { type?: unknown; content?: any }, index: number) {
  const type = typeof block?.type === 'string' ? block.type : 'block';
  const content = block?.content ?? {};

  if (type === 'paragraph') {
    const text = typeof content.text === 'string' ? content.text.trim() : '';
    return {
      label: `Paragraph ${index + 1}`,
      detail: text ? text.slice(0, 120) : 'Text explanation block',
    };
  }

  if (type === 'image') {
    const title = [content.title, content.alt, content.url].find(
      (value) => typeof value === 'string' && value.trim(),
    );
    return {
      label: `Image ${index + 1}`,
      detail: title ?? 'Image block',
    };
  }

  if (type === 'video') {
    const title = [content.title, content.url].find(
      (value) => typeof value === 'string' && value.trim(),
    );
    return {
      label: `Video ${index + 1}`,
      detail: title ?? 'Video block',
    };
  }

  if (type === 'code_block') {
    const language = typeof content.language === 'string' ? content.language : 'code';
    return {
      label: `Code Block ${index + 1}`,
      detail: `Language: ${language}`,
    };
  }

  if (type === 'recap') {
    const bullets = Array.isArray(content.bullets) ? content.bullets.length : 0;
    return {
      label: `Recap ${index + 1}`,
      detail: bullets > 0 ? `${bullets} takeaway bullet${bullets === 1 ? '' : 's'}` : 'Recap block',
    };
  }

  return {
    label: `${String(type).replace(/_/g, ' ')} ${index + 1}`,
    detail: 'Custom lesson block',
  };
}

function getBlockComparisonState(
  block: { type?: unknown; content?: any },
  index: number,
  otherBlocks: Array<{ type?: unknown; content?: any }>,
) {
  const currentSignature = JSON.stringify(block ?? null);
  const counterpart = otherBlocks[index];

  if (!counterpart) {
    return {
      label: 'Only in this version',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  const counterpartSignature = JSON.stringify(counterpart ?? null);
  if (currentSignature === counterpartSignature) {
    return {
      label: 'Matches other version',
      className: 'border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-subtle)]',
    };
  }

  return {
    label: 'Updated content',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  };
}

function summarizeBlockField(value: unknown) {
  if (typeof value === 'string') {
    return value.trim().slice(0, 70);
  }

  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? '' : 's'}`;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
}

function getBlockDifferenceNotes(
  block: { type?: unknown; content?: any },
  counterpart: { type?: unknown; content?: any } | undefined,
  index: number,
) {
  if (!counterpart) return [];

  const currentType = typeof block.type === 'string' ? block.type : 'block';
  const otherType = typeof counterpart.type === 'string' ? counterpart.type : 'block';
  const notes: string[] = [];

  if (currentType !== otherType) {
    notes.push(`Type changed from ${otherType.replace(/_/g, ' ')} to ${currentType.replace(/_/g, ' ')}.`);
  }

  const currentContent =
    block.content && typeof block.content === 'object' ? (block.content as Record<string, unknown>) : {};
  const otherContent =
    counterpart.content && typeof counterpart.content === 'object'
      ? (counterpart.content as Record<string, unknown>)
      : {};

  const fieldLabels: Record<string, string> = {
    text: 'Text',
    title: 'Title',
    caption: 'Caption',
    url: 'Media source',
    alt: 'Alt text',
    posterUrl: 'Poster image',
    language: 'Language',
    code: 'Code sample',
    bullets: 'Recap bullets',
  };

  for (const key of ['text', 'title', 'caption', 'url', 'alt', 'posterUrl', 'language', 'code', 'bullets']) {
    const currentValue = currentContent[key];
    const otherValue = otherContent[key];

    if (JSON.stringify(currentValue ?? null) === JSON.stringify(otherValue ?? null)) {
      continue;
    }

    const previousPreview = summarizeBlockField(otherValue);
    if (previousPreview) {
      notes.push(`${fieldLabels[key]} changed. Previous: ${previousPreview}`);
    } else {
      notes.push(`${fieldLabels[key]} changed.`);
    }

    if (notes.length >= 3) {
      break;
    }
  }

  if (notes.length === 0) {
    const previousSummary = describeLessonBlock(counterpart, index).detail;
    notes.push(`Previously: ${previousSummary}`);
  }

  return notes;
}

const BLOCK_TEMPLATES = {
  paragraph: {
    type: 'paragraph',
    content: {
      text: 'Explain the concept in simple, direct language.',
    },
  },
  image: {
    type: 'image',
    content: {
      url: 'https://example.com/lesson-visual.png',
      alt: 'Lesson visual',
      title: 'Diagram',
      caption: 'Optional caption for the image block.',
    },
  },
  video: {
    type: 'video',
    content: {
      url: 'https://example.com/module-walkthrough.mp4',
      title: 'Lesson walkthrough',
      caption: 'Use MP4, YouTube, Vimeo, or Loom URLs.',
      posterUrl: 'https://example.com/poster.png',
    },
  },
  code: {
    type: 'code_block',
    content: {
      language: 'python',
      code: "print('Hello from SkillForge')",
    },
  },
  recap: {
    type: 'recap',
    content: {
      bullets: ['Key takeaway one', 'Key takeaway two'],
    },
  },
} as const;

export function EditLessonClient({ id }: { id: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const lessonQuery = useQuery({
    queryKey: ['admin', 'lessons', id],
    queryFn: () => adminApi.lessons.get(id),
  });
  const mediaAssetsQuery = useQuery({
    queryKey: ['admin', 'media-assets'],
    queryFn: adminApi.mediaAssets.list,
  });

  const [form, setForm] = React.useState<any>(null);
  const [blocksText, setBlocksText] = React.useState('');
  const [selectedImageAssetId, setSelectedImageAssetId] = React.useState('');
  const [selectedVideoAssetId, setSelectedVideoAssetId] = React.useState('');
  const [reviewDraftNote, setReviewDraftNote] = React.useState('');

  const appendBlockTemplate = React.useCallback((template: { type: string; content: any }) => {
    try {
      const parsed = JSON.parse(blocksText || '[]') as Array<{ type: string; content: any }>;
      setBlocksText(prettyJson([...parsed, template]));
    } catch {
      setBlocksText(prettyJson([template]));
    }
  }, [blocksText]);

  const appendUploadedAssetBlock = React.useCallback((asset: AdminMediaAsset) => {
    if (asset.type === 'image') {
      appendBlockTemplate({
        type: 'image',
        content: {
          url: asset.url,
          alt: asset.altText ?? asset.title,
          title: asset.title,
          caption: 'Uploaded from the media library.',
        },
      });
      return;
    }

    if (asset.type === 'video') {
      appendBlockTemplate({
        type: 'video',
        content: {
          url: asset.url,
          title: asset.title,
          caption: 'Uploaded from the media library.',
          posterUrl: null,
        },
      });
    }
  }, [appendBlockTemplate]);

  const appendLibraryAssetBlock = React.useCallback(
    (asset: AdminMediaAsset) => {
      appendUploadedAssetBlock(asset);
      if (asset.type === 'image') {
        setSelectedImageAssetId('');
      }
      if (asset.type === 'video') {
        setSelectedVideoAssetId('');
      }
    },
    [appendUploadedAssetBlock],
  );

  React.useEffect(() => {
    if (!lessonQuery.data) return;
    setForm({
      title: lessonQuery.data.title,
      slug: lessonQuery.data.slug,
      learningObjective: lessonQuery.data.learningObjective ?? '',
      estimatedMinutes: lessonQuery.data.estimatedMinutes ?? 10,
      order: lessonQuery.data.order ?? 0,
      status: lessonQuery.data.status,
      aiPromptSeed: lessonQuery.data.aiPromptSeed ?? '',
    });
    setBlocksText(
      prettyJson(
        (lessonQuery.data.blocks ?? []).map((block) => ({
          type: block.type,
          content: block.content,
        })),
      ),
    );
  }, [lessonQuery.data]);

  const save = useMutation({
    mutationFn: async () => {
      let blocks: Array<{ type: string; order: number; content: any }> | undefined;
      try {
        const parsed = JSON.parse(blocksText) as Array<{ type: string; content: any }>;
        blocks = parsed.map((block, index) => ({
          type: block.type,
          order: index,
          content: block.content,
        }));
      } catch {
        throw new Error('Lesson content is not valid JSON.');
      }

      return adminApi.lessons.update(id, {
        ...form,
        estimatedMinutes: Number(form.estimatedMinutes),
        order: Number(form.order),
        learningObjective: form.learningObjective || undefined,
        aiPromptSeed: form.aiPromptSeed || undefined,
        blocks,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'lessons', id] });
      toast({ title: 'Lesson saved', description: 'Your changes were applied.' });
    },
    onError: (error) =>
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const upsertQuiz = useMutation({
    mutationFn: async () =>
      adminApi.lessons.upsertQuiz(id, { passingScore: 70, status: 'draft' }),
    onSuccess: async (quiz) => {
      await qc.invalidateQueries({ queryKey: ['admin', 'lessons', id] });
      router.push(`/admin/quizzes/${quiz.id}/edit`);
    },
  });

  const restoreRevision = useMutation({
    mutationFn: (revisionId: string) => adminApi.lessons.restoreRevision(id, revisionId),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'lessons', id] }),
        qc.invalidateQueries({
          queryKey: ['admin', 'modules', lessonQuery.data?.moduleId, 'lessons'],
        }),
      ]);
      toast({
        title: 'Revision restored',
        description: 'The lesson was rolled back to the selected revision.',
      });
    },
    onError: (error) =>
      toast({
        title: 'Restore failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      }),
  });

  const approveReview = useMutation({
    mutationFn: async () => adminApi.lessons.approveReview(id, reviewDraftNote.trim() || undefined),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'lessons', id] }),
        qc.invalidateQueries({
          queryKey: ['admin', 'modules', lessonQuery.data?.moduleId, 'lessons'],
        }),
      ]);
      setReviewDraftNote('');
      toast({ title: 'Review approved', description: 'This lesson can now be published.' });
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
      adminApi.lessons.requestChanges(id, reviewDraftNote.trim() || undefined),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'lessons', id] }),
        qc.invalidateQueries({
          queryKey: ['admin', 'modules', lessonQuery.data?.moduleId, 'lessons'],
        }),
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

  if (lessonQuery.isLoading || !form) {
    return (
      <main className="space-y-6">
        <div className="h-20 rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
        <div className="h-[34rem] rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)]" />
      </main>
    );
  }

  if (lessonQuery.isError) {
    return (
      <main className="rounded-[1.8rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
        <div className="font-semibold">Could not load lesson</div>
        <div className="mt-2 text-[var(--site-danger)]/80">
          {lessonQuery.error instanceof Error ? lessonQuery.error.message : 'Unknown error'}
        </div>
      </main>
    );
  }

  const lesson = lessonQuery.data!;
  const mediaAssets = mediaAssetsQuery.data ?? [];
  const imageAssets = mediaAssets.filter((asset) => asset.type === 'image');
  const videoAssets = mediaAssets.filter((asset) => asset.type === 'video');
  const selectedImageAsset =
    imageAssets.find((asset) => asset.id === selectedImageAssetId) ?? null;
  const selectedVideoAsset =
    videoAssets.find((asset) => asset.id === selectedVideoAssetId) ?? null;
  let parsedCurrentBlocks: Array<{ type: string; order: number; content: any }> = [];
  try {
    parsedCurrentBlocks = (JSON.parse(blocksText || '[]') as Array<{ type: string; content: any }>).map(
      (block, index) => ({
        type: block.type,
        order: index,
        content: block.content,
      }),
    );
  } catch {
    parsedCurrentBlocks = [];
  }
  const currentRevisionSnapshot = form
    ? {
        title: form.title,
        slug: form.slug,
        learningObjective: form.learningObjective || null,
        aiPromptSeed: form.aiPromptSeed || null,
        estimatedMinutes:
          form.estimatedMinutes === '' || form.estimatedMinutes === null
            ? null
            : Number(form.estimatedMinutes),
        order: form.order === '' || form.order === null ? null : Number(form.order),
        status: form.status,
        blocks: parsedCurrentBlocks,
      }
    : null;
  const revisionFieldRenderers = React.useMemo(
    () => ({
      blocks: (value: unknown, context: { otherValue: unknown; side: 'revision' | 'current' }) => {
        const blocks = Array.isArray(value)
          ? value.filter(
              (item): item is { type?: unknown; content?: any } =>
                Boolean(item) && typeof item === 'object',
            )
          : [];
        const otherBlocks = Array.isArray(context.otherValue)
          ? context.otherValue.filter(
              (item): item is { type?: unknown; content?: any } =>
                Boolean(item) && typeof item === 'object',
            )
          : [];

        if (blocks.length === 0) {
          return <span className="italic text-[var(--site-subtle)]">No lesson blocks</span>;
        }

        const counts = blocks.reduce<Record<string, number>>((acc, block) => {
          const type =
            typeof block.type === 'string' && block.type.trim()
              ? block.type.replace(/_/g, ' ')
              : 'block';
          acc[type] = (acc[type] ?? 0) + 1;
          return acc;
        }, {});

        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-1 text-xs font-semibold text-[var(--site-text)]">
                {blocks.length} block{blocks.length === 1 ? '' : 's'}
              </span>
              {Object.entries(counts).map(([type, count]) => (
                <span
                  key={type}
                  className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary"
                >
                  {count} {type}
                </span>
              ))}
            </div>
            {blocks.map((block, index) => {
              const summary = describeLessonBlock(block, index);
              const comparison = getBlockComparisonState(block, index, otherBlocks);
              const counterpart = otherBlocks[index];
              const differenceNotes = getBlockDifferenceNotes(block, counterpart, index);
              return (
                <div
                  key={`${String(block.type ?? 'block')}-${index}`}
                  className="rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--site-subtle)]">
                      {summary.label}
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] ${comparison.className}`}
                    >
                      {comparison.label}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-[var(--site-text)]">{summary.detail}</div>
                  {differenceNotes.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {differenceNotes.map((note) => (
                        <div
                          key={note}
                          className="text-xs leading-5 text-[var(--site-muted)]"
                        >
                          • {note}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {otherBlocks.length > blocks.length ? (
              <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {otherBlocks.length - blocks.length} block
                {otherBlocks.length - blocks.length === 1 ? '' : 's'} exist only in the{' '}
                {context.side === 'revision' ? 'current version' : 'revision'}.
              </div>
            ) : null}
          </div>
        );
      },
    }),
    [],
  );
  const saveLabel =
    form?.status === 'published'
      ? 'Publish Changes'
      : form?.status === 'archived'
        ? 'Archive Changes'
        : 'Save Draft';

  return (
    <main className="space-y-6">
      <AdminPageIntro
        title="Edit Lesson"
        description="Update lesson metadata, AI prompt guidance, and content blocks in one view."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/modules/${lesson.moduleId}/edit`}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 text-lg font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Module
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px]">
        <AdminSurface>
          <div className="grid gap-5 md:grid-cols-2">
            <AdminField label="Lesson Title" className="md:col-span-2">
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

            <AdminField label="Learning Objective" className="md:col-span-2">
              <textarea
                value={form.learningObjective}
                onChange={(event) => setForm({ ...form, learningObjective: event.target.value })}
                rows={3}
                className={adminTextareaClassName}
              />
            </AdminField>

            <AdminField label="Estimated Minutes">
              <input
                value={String(form.estimatedMinutes)}
                onChange={(event) => setForm({ ...form, estimatedMinutes: event.target.value })}
                className={adminInputClassName}
              />
            </AdminField>

            <AdminField label="Order">
              <input
                value={String(form.order)}
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
                  disabled={lessonQuery.data?.reviewStatus !== 'approved'}
                >
                  {lessonQuery.data?.reviewStatus === 'approved'
                    ? 'Published'
                    : 'Published (approve review first)'}
                </option>
                <option value="archived">Archived</option>
              </select>
            </AdminField>

            <AdminField label="AI Tutor Instructions" className="md:col-span-2">
              <textarea
                value={form.aiPromptSeed}
                onChange={(event) => setForm({ ...form, aiPromptSeed: event.target.value })}
                rows={4}
                className={adminTextareaClassName}
              />
            </AdminField>
          </div>

          <div className="mt-6">
            <AdminField
              label="Lesson Content Blocks"
              hint='Format: [{ "type": "paragraph", "content": { ... } }]. Add image or video blocks whenever this lesson needs media.'
            >
              <div className="mb-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => appendBlockTemplate(BLOCK_TEMPLATES.paragraph)}
                  className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
                >
                  Add paragraph
                </button>
                <button
                  type="button"
                  onClick={() => appendBlockTemplate(BLOCK_TEMPLATES.image)}
                  className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
                >
                  Add image
                </button>
                <button
                  type="button"
                  onClick={() => appendBlockTemplate(BLOCK_TEMPLATES.video)}
                  className="rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary transition hover:bg-primary/15"
                >
                  Add video
                </button>
                <button
                  type="button"
                  onClick={() => appendBlockTemplate(BLOCK_TEMPLATES.code)}
                  className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
                >
                  Add code
                </button>
                <button
                  type="button"
                  onClick={() => appendBlockTemplate(BLOCK_TEMPLATES.recap)}
                  className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
                >
                  Add recap
                </button>
                <AdminMediaAssetUploadButton
                  kind="image"
                  onUploaded={appendUploadedAssetBlock}
                  className="inline-flex h-auto items-center justify-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)] disabled:cursor-not-allowed disabled:opacity-70"
                />
                <AdminMediaAssetUploadButton
                  kind="video"
                  onUploaded={appendUploadedAssetBlock}
                  className="inline-flex h-auto items-center justify-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </div>
              <div className="mb-5 grid gap-4 xl:grid-cols-2">
                <div className="rounded-[1.3rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
                  <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--site-subtle)]">
                    Insert image from library
                  </div>
                  <div className="space-y-3">
                    <AdminMediaAssetPicker
                      kind="image"
                      assets={imageAssets}
                      value={selectedImageAssetId}
                      onChange={setSelectedImageAssetId}
                      emptyLabel="Pick an image asset to insert"
                      buttonLabel="Browse image assets"
                    />
                    <button
                      type="button"
                      onClick={() => selectedImageAsset && appendLibraryAssetBlock(selectedImageAsset)}
                      disabled={!selectedImageAsset}
                      className="inline-flex h-12 items-center justify-center rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Insert selected image
                    </button>
                  </div>
                </div>

                <div className="rounded-[1.3rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
                  <div className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--site-subtle)]">
                    Insert video from library
                  </div>
                  <div className="space-y-3">
                    <AdminMediaAssetPicker
                      kind="video"
                      assets={videoAssets}
                      value={selectedVideoAssetId}
                      onChange={setSelectedVideoAssetId}
                      emptyLabel="Pick a video asset to insert"
                      buttonLabel="Browse video assets"
                    />
                    <button
                      type="button"
                      onClick={() => selectedVideoAsset && appendLibraryAssetBlock(selectedVideoAsset)}
                      disabled={!selectedVideoAsset}
                      className="inline-flex h-12 items-center justify-center rounded-[1rem] border border-primary/15 bg-primary/10 px-4 text-sm font-semibold text-primary transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Insert selected video
                    </button>
                  </div>
                </div>
              </div>
              <textarea
                value={blocksText}
                onChange={(event) => setBlocksText(event.target.value)}
                rows={18}
                className={`${adminTextareaClassName} font-mono text-sm leading-7`}
              />
            </AdminField>
          </div>
        </AdminSurface>

        <div className="space-y-6">
          <AdminSurface>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
                  Lesson Status
                </div>
                <div className="mt-2">
                  <AdminStatusPill tone={statusTone(form.status)}>
                    {form.status.toUpperCase()}
                  </AdminStatusPill>
                </div>
              </div>
            </div>
          </AdminSurface>

          <ContentReviewWorkflowPanel
            audience="admin"
            reviewStatus={lesson.reviewStatus}
            reviewNotes={lesson.reviewNotes}
            draftNote={reviewDraftNote}
            onDraftNoteChange={setReviewDraftNote}
            onApprove={() => approveReview.mutate()}
            isApproving={approveReview.isPending}
            onRequestChanges={() => requestChanges.mutate()}
            isRequestingChanges={requestChanges.isPending}
          />

          <ContentRevisionPanel
            title="Lesson Revisions"
            revisions={lessonQuery.data?.revisions}
            onRestore={(revisionId) => restoreRevision.mutate(revisionId)}
            restoringRevisionId={restoreRevision.isPending ? restoreRevision.variables : null}
            currentSnapshot={currentRevisionSnapshot}
            fieldLabels={{
              learningObjective: 'Learning objective',
              aiPromptSeed: 'AI tutor instructions',
              estimatedMinutes: 'Estimated minutes',
              blocks: 'Lesson content blocks',
            }}
            fieldRenderers={revisionFieldRenderers}
          />

          <AdminSurface>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[var(--site-text)]">Quiz Control</h2>
                <p className="mt-1 text-sm text-[var(--site-muted)]">
                  Manage the checkpoint attached to this lesson.
                </p>
              </div>
            </div>

            {lesson.quiz ? (
              <div className="mt-5 space-y-4">
                <div className="text-sm text-[var(--site-muted)]">
                  Status: <span className="font-semibold text-[var(--site-text)]">{lesson.quiz.status}</span>
                </div>
                <Link
                  href={`/admin/quizzes/${lesson.quiz.id}/edit`}
                  className="inline-flex h-12 items-center justify-center rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
                >
                  Edit Quiz
                </Link>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="text-sm text-[var(--site-muted)]">No quiz exists for this lesson yet.</div>
                <button
                  type="button"
                  onClick={() => upsertQuiz.mutate()}
                  disabled={upsertQuiz.isPending}
                  className="inline-flex h-12 items-center justify-center rounded-[1rem] bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-70"
                >
                  {upsertQuiz.isPending ? 'Creating...' : 'Create Quiz'}
                </button>
              </div>
            )}
          </AdminSurface>

          {(save.isError || upsertQuiz.isError || restoreRevision.isError || approveReview.isError || requestChanges.isError) ? (
            <div className="rounded-[1.2rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
              {save.error instanceof Error
                ? save.error.message
                : upsertQuiz.error instanceof Error
                  ? upsertQuiz.error.message
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
    </main>
  );
}

function statusTone(status: string) {
  if (status === 'published') return 'emerald' as const;
  if (status === 'archived') return 'slate' as const;
  return 'orange' as const;
}
