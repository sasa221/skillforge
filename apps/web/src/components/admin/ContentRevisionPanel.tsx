'use client';

import * as React from 'react';

import type { AdminContentRevision } from '@/lib/content/types';

type FieldRendererContext = {
  side: 'revision' | 'current';
  otherValue: unknown;
  fieldKey: string;
};

type FieldRenderer = (value: unknown, context: FieldRendererContext) => React.ReactNode;

function formatRevisionDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function normalizeValue(value: unknown): unknown {
  if (value === '') return null;
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalizeValue(nested)]),
    );
  }
  return value ?? null;
}

function valuesAreEqual(left: unknown, right: unknown) {
  return JSON.stringify(normalizeValue(left)) === JSON.stringify(normalizeValue(right));
}

function formatFieldLabel(key: string, fieldLabels?: Record<string, string>) {
  if (fieldLabels?.[key]) return fieldLabels[key];
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderValue(value: unknown, renderer?: FieldRenderer, context?: FieldRendererContext) {
  if (value === null || value === undefined || value === '') {
    return <span className="italic text-[var(--site-subtle)]">Not set</span>;
  }

  if (renderer && context) {
    return renderer(value, context);
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value) || typeof value === 'object') {
    return (
      <pre className="overflow-x-auto rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-3 py-2 text-xs leading-6 text-[var(--site-text)]">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return String(value);
}

export function ContentRevisionPanel({
  title = 'Revision history',
  revisions,
  onRestore,
  restoringRevisionId,
  currentSnapshot,
  hiddenFields = ['id', 'courseId', 'moduleId', 'lessonId'],
  fieldLabels,
  fieldRenderers,
}: {
  title?: string;
  revisions?: AdminContentRevision[];
  onRestore?: (revisionId: string) => void;
  restoringRevisionId?: string | null;
  currentSnapshot?: Record<string, unknown> | null;
  hiddenFields?: string[];
  fieldLabels?: Record<string, string>;
  fieldRenderers?: Record<string, FieldRenderer>;
}) {
  const [previewRevisionId, setPreviewRevisionId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!revisions?.length) {
      setPreviewRevisionId(null);
      return;
    }

    if (!previewRevisionId || !revisions.some((revision) => revision.id === previewRevisionId)) {
      setPreviewRevisionId(revisions[0].id);
    }
  }, [previewRevisionId, revisions]);

  const previewRevision = React.useMemo(
    () => revisions?.find((revision) => revision.id === previewRevisionId) ?? null,
    [previewRevisionId, revisions],
  );

  const previewEntries = React.useMemo(() => {
    const snapshot = (previewRevision?.snapshot as Record<string, unknown> | null | undefined) ?? null;
    if (!snapshot) return [];

    const keys = Array.from(
      new Set([
        ...Object.keys(snapshot),
        ...Object.keys(currentSnapshot ?? {}),
      ]),
    ).filter((key) => !hiddenFields.includes(key));

    const entries = keys.map((key) => {
      const revisionValue = snapshot[key];
      const currentValue = currentSnapshot?.[key];
      const changed = !valuesAreEqual(revisionValue, currentValue);
      return {
        key,
        changed,
        revisionValue,
        currentValue,
      };
    });

    return currentSnapshot ? entries.filter((entry) => entry.changed) : entries;
  }, [currentSnapshot, hiddenFields, previewRevision]);

  if (!revisions || revisions.length === 0) {
    return (
      <div className="rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 shadow-[0_12px_30px_var(--site-shadow)]">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">{title}</div>
        <div className="mt-3 text-sm text-[var(--site-muted)]">
          No revisions yet. The first save will create the initial draft or published snapshot.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 shadow-[0_12px_30px_var(--site-shadow)]">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">{title}</div>
      <div className="mt-4 space-y-3">
        {revisions.map((revision) => {
          const previewing = previewRevisionId === revision.id;
          return (
            <div
              key={revision.id}
              className="rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[var(--site-text)]">{revision.summary}</div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewRevisionId(previewing ? null : revision.id)}
                    className="inline-flex h-8 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
                  >
                    {previewing ? 'Hide Preview' : 'Preview'}
                  </button>
                  {onRestore ? (
                    <button
                      type="button"
                      onClick={() => onRestore(revision.id)}
                      disabled={restoringRevisionId === revision.id}
                      className="inline-flex h-8 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {restoringRevisionId === revision.id ? 'Restoring...' : 'Restore'}
                    </button>
                  ) : null}
                  <div className="rounded-full bg-[var(--site-primary-soft)] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--site-primary)]">
                    {revision.status}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-[var(--site-subtle)]">
                {revision.actor?.profile?.fullName || revision.actor?.email || 'Unknown editor'} -{' '}
                {formatRevisionDate(revision.createdAt)}
              </div>

              {previewing ? (
                <div className="mt-4 rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
                  <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--site-subtle)]">
                    Preview changes before restore
                  </div>

                  {previewEntries.length === 0 ? (
                    <div className="mt-3 text-sm text-[var(--site-muted)]">
                      This revision matches the current version for the tracked fields.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {previewEntries.map((entry) => (
                        <div
                          key={entry.key}
                          className="rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-3"
                        >
                          <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--site-subtle)]">
                            {formatFieldLabel(entry.key, fieldLabels)}
                          </div>
                          <div className="mt-3 grid gap-3 xl:grid-cols-2">
                            <div>
                              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--site-subtle)]">
                                Revision value
                              </div>
                              <div className="text-sm text-[var(--site-text)]">
                                {renderValue(entry.revisionValue, fieldRenderers?.[entry.key], {
                                  side: 'revision',
                                  otherValue: entry.currentValue,
                                  fieldKey: entry.key,
                                })}
                              </div>
                            </div>
                            <div>
                              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--site-subtle)]">
                                Current value
                              </div>
                              <div className="text-sm text-[var(--site-text)]">
                                {renderValue(entry.currentValue, fieldRenderers?.[entry.key], {
                                  side: 'current',
                                  otherValue: entry.revisionValue,
                                  fieldKey: entry.key,
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
