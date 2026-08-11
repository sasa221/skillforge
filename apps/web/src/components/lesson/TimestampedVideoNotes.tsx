'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Plus, Trash2, StickyNote, Bookmark } from 'lucide-react';
import { progressApi } from '@/lib/api/endpoints';
import { useToast } from '@/components/toast/toast-provider';

interface Props {
  lessonId: string;
  onSeekToTimestamp?: (seconds: number) => void;
}

export function TimestampedVideoNotes({ lessonId, onSeekToTimestamp }: Props) {
  const [minutes, setMinutes] = React.useState(0);
  const [seconds, setSeconds] = React.useState(0);
  const [text, setText] = React.useState('');
  const [showAddForm, setShowAddForm] = React.useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['progress', 'notes', lessonId],
    queryFn: () => progressApi.getNotes(lessonId),
  });

  const createMutation = useMutation({
    mutationFn: (body: { timestampSeconds: number; text: string }) => progressApi.createNote(lessonId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', 'notes', lessonId] });
      setText('');
      setShowAddForm(false);
      toast({ title: 'Timestamped note saved!' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => progressApi.deleteNote(lessonId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress', 'notes', lessonId] });
      toast({ title: 'Note deleted' });
    },
  });

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = Math.floor(totalSec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const notes = data?.notes ?? [];

  return (
    <div className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface)] p-6 space-y-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--site-border)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Bookmark className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--site-text)]">Timestamped Lesson Notes</h3>
            <p className="text-[11px] text-[var(--site-muted)]">Save key timestamps & personal study reminders</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm((p) => !p)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--site-primary)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          {showAddForm ? 'Cancel' : 'Add Note'}
        </button>
      </div>

      {/* Add Note Form */}
      {showAddForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            const totalSec = minutes * 60 + seconds;
            createMutation.mutate({ timestampSeconds: totalSec, text });
          }}
          className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] p-4 space-y-3 animate-in fade-in"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[var(--site-muted)]">Timestamp:</span>
            <div className="flex items-center gap-1 font-mono text-xs">
              <input
                type="number"
                min={0}
                max={99}
                value={minutes}
                onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-12 rounded-lg border border-[var(--site-border)] bg-[var(--site-surface)] px-2 py-1 text-center font-bold text-[var(--site-text)]"
              />
              <span>:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={seconds}
                onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="w-12 rounded-lg border border-[var(--site-border)] bg-[var(--site-surface)] px-2 py-1 text-center font-bold text-[var(--site-text)]"
              />
            </div>
          </div>

          <textarea
            placeholder="Write your study note or concept takeaway here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-2.5 text-xs text-[var(--site-text)] focus:border-[var(--site-primary)] focus:outline-none"
          />

          <button
            type="submit"
            disabled={createMutation.isPending || !text.trim()}
            className="rounded-xl bg-[var(--site-primary)] px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Saving...' : 'Save Note'}
          </button>
        </form>
      )}

      {/* Notes List */}
      {isLoading ? (
        <div className="h-16 animate-pulse rounded-2xl bg-[var(--site-bg)]" />
      ) : (
        <div className="space-y-2">
          {notes.length === 0 ? (
            <div className="py-4 text-center text-xs text-[var(--site-muted)]">
              No notes saved for this lesson yet.
            </div>
          ) : (
            notes.map((n: any) => (
              <div
                key={n.id}
                className="flex items-center justify-between rounded-xl border border-[var(--site-border)] bg-[var(--site-bg)] p-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onSeekToTimestamp?.(n.timestampSeconds)}
                    className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-1 font-mono text-[11px] font-bold text-amber-500 transition hover:bg-amber-500/20"
                    title="Jump to timestamp"
                  >
                    <Clock className="h-3 w-3" />
                    {formatTime(n.timestampSeconds)}
                  </button>
                  <p className="text-[var(--site-text)] leading-relaxed">{n.text}</p>
                </div>

                <button
                  onClick={() => deleteMutation.mutate(n.id)}
                  disabled={deleteMutation.isPending}
                  className="p-1 text-[var(--site-muted)] transition hover:text-rose-400"
                  title="Delete note"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
