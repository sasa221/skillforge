'use client';

import * as React from 'react';
import { CheckCircle2, MessageSquareText, Send } from 'lucide-react';

import { adminTextareaClassName } from '@/components/admin/AdminForms';
import { AdminStatusPill, AdminSurface } from '@/components/admin/AdminUi';
import type { ContentReviewStatus } from '@/lib/content/types';

function reviewStatusTone(
  reviewStatus: ContentReviewStatus,
): 'orange' | 'emerald' | 'violet' | 'blue' | 'slate' {
  if (reviewStatus === 'approved') return 'emerald';
  if (reviewStatus === 'submitted') return 'blue';
  if (reviewStatus === 'changes_requested') return 'violet';
  return 'orange';
}

function reviewStatusLabel(reviewStatus: ContentReviewStatus) {
  if (reviewStatus === 'changes_requested') return 'CHANGES REQUESTED';
  return reviewStatus.replace('_', ' ').toUpperCase();
}

function helperCopy(audience: 'admin' | 'instructor', reviewStatus: ContentReviewStatus) {
  if (audience === 'admin') {
    if (reviewStatus === 'submitted') return 'This item is waiting for your review decision.';
    if (reviewStatus === 'changes_requested')
      return 'The instructor still needs to address review feedback.';
    if (reviewStatus === 'approved') return 'This item is approved and can be published.';
    return 'The instructor is still drafting this item and has not submitted it yet.';
  }

  if (reviewStatus === 'submitted') return 'Your content is waiting for admin review.';
  if (reviewStatus === 'changes_requested')
    return 'Review the note below, update the content, then submit it again.';
  if (reviewStatus === 'approved') return 'This content is approved and ready for publishing.';
  return 'Keep editing, then submit this item when you are ready for review.';
}

export function ContentReviewWorkflowPanel({
  audience,
  reviewStatus,
  reviewNotes,
  draftNote,
  onDraftNoteChange,
  onSubmitForReview,
  isSubmitting = false,
  onApprove,
  isApproving = false,
  onRequestChanges,
  isRequestingChanges = false,
}: {
  audience: 'admin' | 'instructor';
  reviewStatus: ContentReviewStatus;
  reviewNotes: string | null;
  draftNote: string;
  onDraftNoteChange: (value: string) => void;
  onSubmitForReview?: () => void;
  isSubmitting?: boolean;
  onApprove?: () => void;
  isApproving?: boolean;
  onRequestChanges?: () => void;
  isRequestingChanges?: boolean;
}) {
  const isBusy = isSubmitting || isApproving || isRequestingChanges;
  const hasAdminActions = Boolean(onApprove || onRequestChanges);

  return (
    <AdminSurface>
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <MessageSquareText className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
            Review Workflow
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <AdminStatusPill tone={reviewStatusTone(reviewStatus)}>
              {reviewStatusLabel(reviewStatus)}
            </AdminStatusPill>
          </div>
          <div className="mt-4 text-sm leading-7 text-[var(--site-muted)]">
            {helperCopy(audience, reviewStatus)}
          </div>
        </div>
      </div>

      {reviewNotes ? (
        <div className="mt-5 rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--site-subtle)]">
            {audience === 'admin' ? 'Latest review note' : 'Admin feedback'}
          </div>
          <p className="mt-2 text-sm leading-7 text-[var(--site-text)]">{reviewNotes}</p>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        <label className="block text-sm font-semibold text-[var(--site-text)]">
          {audience === 'admin' ? 'Review note' : 'Note for the reviewer'}
        </label>
        <textarea
          value={draftNote}
          onChange={(event) => onDraftNoteChange(event.target.value)}
          rows={4}
          className={adminTextareaClassName}
          placeholder={
            audience === 'admin'
              ? 'Add approval notes or explain what needs to change.'
              : 'Add context for the admin reviewer before you submit.'
          }
        />
      </div>

      {audience === 'instructor' && onSubmitForReview ? (
        <div className="mt-5">
          <button
            type="button"
            onClick={onSubmitForReview}
            disabled={isBusy || reviewStatus === 'submitted'}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_14px_30px_rgba(59,130,246,0.2)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {reviewStatus === 'submitted'
              ? 'Submitted for review'
              : isSubmitting
                ? 'Submitting...'
                : 'Submit for review'}
          </button>
        </div>
      ) : null}

      {hasAdminActions ? (
        <div className="mt-5 flex flex-wrap gap-3">
          {onApprove ? (
            <button
              type="button"
              onClick={onApprove}
              disabled={isBusy}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isApproving ? 'Approving...' : 'Approve review'}
            </button>
          ) : null}
          {onRequestChanges ? (
            <button
              type="button"
              onClick={onRequestChanges}
              disabled={isBusy}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] border border-violet-500/20 bg-violet-500/10 px-4 text-sm font-semibold text-violet-700 transition hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MessageSquareText className="h-4 w-4" />
              {isRequestingChanges ? 'Sending...' : 'Request changes'}
            </button>
          ) : null}
        </div>
      ) : null}
    </AdminSurface>
  );
}
