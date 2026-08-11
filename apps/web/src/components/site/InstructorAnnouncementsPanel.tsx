'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, AlertCircle, Plus, Send, BellRing } from 'lucide-react';
import { coursesApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/lib/auth/store';
import { useToast } from '@/components/toast/toast-provider';

export function InstructorAnnouncementsPanel({ courseId }: { courseId: string }) {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isUrgent, setIsUrgent] = React.useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const isInstructor = user?.roles?.some((r) => r === 'instructor' || r === 'admin' || r === 'super_admin');

  const { data, isLoading } = useQuery({
    queryKey: ['courses', 'announcements', courseId],
    queryFn: () => coursesApi.announcements(courseId),
  });

  const createMutation = useMutation({
    mutationFn: (body: { title: string; message: string; isUrgent?: boolean }) =>
      coursesApi.createAnnouncement(courseId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'announcements', courseId] });
      setTitle('');
      setMessage('');
      setIsUrgent(false);
      setShowAddForm(false);
      toast({ title: 'Announcement published!', description: 'All enrolled students have been notified.' });
    },
  });

  const announcements = data?.announcements ?? [];

  return (
    <div className="rounded-[2.2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-8 shadow-[0_22px_50px_var(--site-shadow)] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--site-border)] pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--site-text)]">Instructor Announcements</h2>
            <p className="text-xs text-[var(--site-muted)]">Official course updates, schedules, and alerts</p>
          </div>
        </div>

        {isInstructor && (
          <button
            onClick={() => setShowAddForm((p) => !p)}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-black shadow-md transition hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            {showAddForm ? 'Cancel' : 'New Announcement'}
          </button>
        )}
      </div>

      {/* Post Announcement Form */}
      {showAddForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !message.trim()) return;
            createMutation.mutate({ title, message, isUrgent });
          }}
          className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] p-5 space-y-3 animate-in fade-in"
        >
          <h4 className="text-sm font-bold text-[var(--site-text)]">Post Announcement to Students</h4>
          <input
            type="text"
            placeholder="Announcement Title (e.g. Live Q&A Scheduled)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-3 text-xs text-[var(--site-text)] focus:border-amber-500 focus:outline-none"
          />
          <textarea
            placeholder="Write announcement details..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-3 text-xs text-[var(--site-text)] focus:border-amber-500 focus:outline-none"
          />

          <div className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              id="urgent"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="rounded border-[var(--site-border)] text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="urgent" className="font-semibold text-rose-400 flex items-center gap-1 cursor-pointer">
              <AlertCircle className="h-3.5 w-3.5" />
              Mark as Urgent Alert
            </label>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending || !title.trim() || !message.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {createMutation.isPending ? 'Publishing...' : 'Broadcast Announcement'}
          </button>
        </form>
      )}

      {/* List of Announcements */}
      {isLoading ? (
        <div className="h-20 animate-pulse rounded-2xl bg-[var(--site-bg)]" />
      ) : (
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <div className="py-6 text-center text-xs text-[var(--site-muted)]">
              No course announcements posted yet.
            </div>
          ) : (
            announcements.map((ann: any) => (
              <div
                key={ann.id}
                className={`rounded-2xl border p-5 space-y-2 ${
                  ann.isUrgent
                    ? 'bg-rose-950/20 border-rose-800/40'
                    : 'bg-[var(--site-bg)] border-[var(--site-border)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {ann.isUrgent ? (
                      <span className="flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                        <AlertCircle className="h-3 w-3" />
                        Urgent Update
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                        <BellRing className="h-3 w-3" />
                        Course Update
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--site-muted)]">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[var(--site-text)]">{ann.title}</h3>
                <p className="text-xs leading-relaxed text-[var(--site-muted)]">{ann.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
