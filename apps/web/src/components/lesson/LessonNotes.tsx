'use client';
import * as React from 'react';
import { StickyNote } from 'lucide-react';

type Props = { lessonSlug: string };

export function LessonNotes({ lessonSlug }: Props) {
  const key = `skillforge_note_${lessonSlug}`;
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setText(localStorage.getItem(key) ?? '');
    }
  }, [key]);

  // Debounced save
  React.useEffect(() => {
    if (!text && !localStorage.getItem(key)) return;
    const timer = setTimeout(() => {
      localStorage.setItem(key, text);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
    return () => clearTimeout(timer);
  }, [text, key]);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="mb-3 w-80 rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--site-border)] px-4 py-3">
            <span className="text-sm font-semibold text-[var(--site-text)]">📝 My Notes</span>
            <span className="text-xs text-[var(--site-muted)]">{saved ? '✓ Saved' : 'Auto-saving...'}</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your notes for this lesson here..."
            className="h-48 w-full resize-none bg-transparent p-4 text-sm text-[var(--site-text)] placeholder:text-[var(--site-subtle)] outline-none"
          />
          {text && (
            <div className="border-t border-[var(--site-border)] p-2">
              <button
                onClick={() => { setText(''); localStorage.removeItem(key); }}
                className="w-full text-xs text-[var(--site-danger)] hover:bg-[var(--site-danger-soft)] rounded-lg py-1"
              >
                Clear notes
              </button>
            </div>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen(p => !p)}
        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition ${
          open
            ? 'bg-[var(--site-primary)] text-white'
            : 'bg-[var(--site-surface)] border border-[var(--site-border)] text-[var(--site-muted)] hover:text-[var(--site-primary)]'
        }`}
        title="My Notes"
      >
        <StickyNote className="h-5 w-5" />
        {text && !open && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[var(--site-primary)]" />
        )}
      </button>
    </div>
  );
}
