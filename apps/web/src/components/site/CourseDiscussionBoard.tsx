'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, Plus, Search, CheckCircle2, Bot, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';
import { coursesApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/lib/auth/store';
import { useToast } from '@/components/toast/toast-provider';

export function CourseDiscussionBoard({ courseId }: { courseId: string }) {
  const [search, setSearch] = React.useState('');
  const [showAskForm, setShowAskForm] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [activeReplyId, setActiveReplyId] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const { data, isLoading } = useQuery({
    queryKey: ['courses', 'discussions', courseId],
    queryFn: () => coursesApi.discussions(courseId),
  });

  const createMutation = useMutation({
    mutationFn: (body: { title: string; content: string }) => coursesApi.createDiscussion(courseId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'discussions', courseId] });
      setTitle('');
      setContent('');
      setShowAskForm(false);
      toast({ title: 'Question posted!', description: 'Your discussion question is now visible to students & instructors.' });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ discussionId, content }: { discussionId: string; content: string }) =>
      coursesApi.addDiscussionReply(courseId, discussionId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'discussions', courseId] });
      setReplyText('');
      setActiveReplyId(null);
      toast({ title: 'Reply posted!' });
    },
  });

  const discussions = (data?.discussions ?? []).filter(
    (d: any) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.content.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="rounded-[2.2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-8 shadow-[0_22px_50px_var(--site-shadow)] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--site-border)] pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--site-text)]">Q&A Discussion Board</h2>
            <p className="text-xs text-[var(--site-muted)]">Ask questions, get help from instructors & AI</p>
          </div>
        </div>

        {user && (
          <button
            onClick={() => setShowAskForm((p) => !p)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--site-primary)] px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            {showAskForm ? 'Cancel' : 'Ask Question'}
          </button>
        )}
      </div>

      {/* Ask Question Form */}
      {showAskForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !content.trim()) return;
            createMutation.mutate({ title, content });
          }}
          className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] p-5 space-y-3 animate-in fade-in slide-in-from-top-3"
        >
          <h4 className="text-sm font-bold text-[var(--site-text)]">New Question</h4>
          <input
            type="text"
            placeholder="Question title (e.g., How do I format SQL dates?)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-3 text-xs text-[var(--site-text)] focus:border-[var(--site-primary)] focus:outline-none"
          />
          <textarea
            placeholder="Provide context or code snippets so others can help you best..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-3 text-xs text-[var(--site-text)] focus:border-[var(--site-primary)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !title.trim() || !content.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--site-primary)] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {createMutation.isPending ? 'Posting...' : 'Post Question'}
          </button>
        </form>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--site-muted)]" />
        <input
          type="text"
          placeholder="Search course questions & answers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-[var(--site-border)] bg-[var(--site-bg)] pl-10 pr-4 py-2.5 text-xs text-[var(--site-text)] focus:border-[var(--site-primary)] focus:outline-none"
        />
      </div>

      {/* Question Threads List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--site-bg)]" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {discussions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--site-muted)]">
              No discussion questions found. Be the first to ask!
            </div>
          ) : (
            discussions.map((disc: any) => (
              <div key={disc.id} className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--site-text)]">{disc.title}</h3>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--site-muted)]">
                      <span>Posted by <strong className="text-[var(--site-text)]">{disc.userName}</strong></span>
                      <span>•</span>
                      <span>{new Date(disc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-[var(--site-primary)]/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--site-primary)]">
                    {disc.replies?.length ?? 0} {disc.replies?.length === 1 ? 'reply' : 'replies'}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-[var(--site-muted)]">{disc.content}</p>

                {/* Replies Thread */}
                {disc.replies && disc.replies.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-[var(--site-border)]/60 pt-3">
                    {disc.replies.map((rep: any) => (
                      <div
                        key={rep.id}
                        className={`rounded-xl p-3 text-xs space-y-1 ${
                          rep.isInstructor
                            ? 'bg-amber-500/10 border border-amber-500/20'
                            : rep.isAi
                            ? 'bg-indigo-500/10 border border-indigo-500/20'
                            : 'bg-[var(--site-surface)] border border-[var(--site-border)]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 font-semibold text-[var(--site-text)]">
                            {rep.isInstructor && <GraduationCap className="h-3.5 w-3.5 text-amber-500" />}
                            {rep.isAi && <Bot className="h-3.5 w-3.5 text-indigo-400" />}
                            <span>{rep.userName}</span>
                            {rep.isInstructor && (
                              <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-black uppercase">
                                Instructor
                              </span>
                            )}
                            {rep.isAi && (
                              <span className="rounded bg-indigo-500 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                                AI Assistant
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[var(--site-muted)]">
                            {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-[var(--site-muted)]">{rep.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply action button */}
                {user && (
                  <div className="pt-2">
                    {activeReplyId === disc.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Write an answer..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="flex-1 rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-1.5 text-xs text-[var(--site-text)] focus:border-[var(--site-primary)] focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            if (!replyText.trim()) return;
                            replyMutation.mutate({ discussionId: disc.id, content: replyText });
                          }}
                          disabled={replyMutation.isPending || !replyText.trim()}
                          className="rounded-xl bg-[var(--site-primary)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                        >
                          Reply
                        </button>
                        <button
                          onClick={() => setActiveReplyId(null)}
                          className="rounded-xl border border-[var(--site-border)] px-3 py-1.5 text-xs text-[var(--site-muted)] hover:text-[var(--site-text)]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveReplyId(disc.id)}
                        className="text-xs font-semibold text-[var(--site-primary)] hover:underline"
                      >
                        + Write a reply
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
