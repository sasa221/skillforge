'use client';

import * as React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/toast/toast-provider';
import { aiApi } from '@/lib/api/endpoints';
import type { AiChatMessage, AiChatMode } from '@/lib/content/types';

const modes: Array<{ id: AiChatMode; label: string }> = [
  { id: 'explain', label: 'Explain' },
  { id: 'simplify', label: 'Simplify' },
  { id: 'give_example', label: 'Give example' },
  { id: 'summarize', label: 'Summarize' },
  { id: 'hint', label: 'Hint' },
  { id: 'quiz_me', label: 'Quiz me' },
];

export function AiTeacherPanel({ lessonId }: { lessonId: string }) {
  const { toast } = useToast();
  const history = useQuery({
    queryKey: ['ai', 'lesson', lessonId, 'history'],
    queryFn: () => aiApi.lessonHistory(lessonId),
  });

  const [sessionId, setSessionId] = React.useState<string | undefined>(undefined);
  const [messages, setMessages] = React.useState<AiChatMessage[]>([]);
  const [mode, setMode] = React.useState<AiChatMode>('explain');
  const [text, setText] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!history.data) return;
    setSessionId(history.data.sessionId ?? undefined);
    setMessages(history.data.messages ?? []);
  }, [history.data]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const send = useMutation({
    mutationFn: async () => {
      const msg = text.trim();
      if (!msg) throw new Error('Type a message');
      return aiApi.lessonChat({ lessonId, message: msg, sessionId, mode });
    },
    onMutate: async () => {
      const msg = text.trim();
      if (!msg) return;
      setMessages((m) => [
        ...m,
        { id: `tmp_${Date.now()}`, role: 'user', content: msg, createdAt: new Date().toISOString() },
      ]);
      setText('');
    },
    onSuccess: (res) => {
      setSessionId(res.sessionId);
      // Append persisted messages
      setMessages((m) => [...m.filter((x) => !x.id.startsWith('tmp_')), ...res.messages]);
    },
    onError: (e) => {
      toast({
        title: 'AI message failed',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      });
      setMessages((m) => m.filter((x) => !x.id.startsWith('tmp_')));
    },
  });

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">AI teacher</div>
        <div className="flex flex-wrap gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`rounded-md border px-2 py-1 text-xs hover:bg-muted ${
                mode === m.id ? 'bg-muted' : ''
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {history.isLoading ? (
        <div className="mt-3 text-sm text-muted-foreground">Loading chat…</div>
      ) : history.isError ? (
        <div className="mt-3 rounded-xl border bg-background p-3 text-sm">
          <div className="font-medium">Couldn’t load chat</div>
          <div className="mt-1 text-muted-foreground">
            {history.error instanceof Error ? history.error.message : 'Please try again.'}
          </div>
          <div className="mt-3">
                    <Button size="sm" variant="outline" onClick={() => history.refetch()}>
              Retry
            </Button>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="mt-3 rounded-xl border bg-background p-3 text-sm text-muted-foreground">
          Ask a question about this lesson to get help. Try “Explain the key idea in one paragraph.”
        </div>
      ) : (
        <div ref={scrollRef} className="mt-4 max-h-72 space-y-3 overflow-auto rounded-xl border bg-background p-3">
          {messages.map((m) => (
            <div key={m.id} className="text-sm">
              <div className="text-xs text-muted-foreground">{m.role}</div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          ))}
          {send.isPending ? <div className="text-xs text-muted-foreground">AI is typing…</div> : null}
        </div>
      )}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send.mutate();
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask about this lesson…"
          disabled={send.isPending}
        />
        <Button type="submit" disabled={send.isPending || text.trim().length === 0}>
          {send.isPending ? 'Sending…' : 'Send'}
        </Button>
      </form>
    </div>
  );
}

