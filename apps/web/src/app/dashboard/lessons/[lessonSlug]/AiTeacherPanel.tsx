'use client';

import * as React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Bot, Lightbulb, SendHorizonal, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/toast/toast-provider';
import { aiApi } from '@/lib/api/endpoints';
import type { AiChatMessage, AiChatMode, AiStructuredResponse } from '@/lib/content/types';
import { AiGroundingPanel } from '@/components/ai/AiGroundingPanel';
import { AiLearningContextBanner } from '@/components/ai/AiLearningContextBanner';
import { AiSourceChips } from '@/components/ai/AiSourceChips';
import { AiStructuredPanel } from '@/components/ai/AiStructuredPanel';
import { env } from '@/lib/env';
import { useAuthStore } from '@/lib/auth/store';

import { Ai3DOrb } from '@/components/3d/Ai3DOrb';

const modes: Array<{ id: AiChatMode; label: string }> = [
  { id: 'explain', label: 'Explain' },
  { id: 'simplify', label: 'Simplify' },
  { id: 'give_example', label: 'Example' },
  { id: 'summarize', label: 'Summary' },
  { id: 'hint', label: 'Hint' },
  { id: 'quiz_me', label: 'Quiz me' },
  { id: 'study_plan', label: 'Study plan' },
  { id: 'check_my_answer', label: 'Check answer' },
];

const lessonModeDescriptions: Record<AiChatMode, string> = {
  explain: 'Explains the current lesson point by point and keeps you aligned with the next step.',
  simplify: 'Rewrites the lesson in easier language and smaller pieces you can act on right now.',
  give_example: 'Gives one or two grounded examples from this lesson.',
  summarize: 'Turns the lesson into a compact recap you can revisit before moving on.',
  hint: 'Nudges you toward the next step without giving away the full answer.',
  quiz_me: 'Asks short questions from this lesson and the next checkpoint-ready idea.',
  study_plan: 'Builds a short plan for how to finish this lesson, review it, and get ready for the next checkpoint.',
  check_my_answer: 'Reviews your answer against this lesson and tells you what to fix before moving on.',
  explain_wrong_answer: 'Explains why an answer was wrong and how to fix it.',
};

function getLessonQuickPrompts(mode: AiChatMode) {
  const prompts: Record<AiChatMode, string[]> = {
    explain: ['Explain this lesson in simpler words.', 'Walk me through the key idea step by step.'],
    simplify: ['Make this lesson easier to understand.', 'Explain this lesson like I am brand new to it.'],
    give_example: ['Give me one real example.', 'Show me a small example from this lesson.'],
    summarize: ['Summarize the main point of this lesson.', 'Give me a short recap I can remember.'],
    hint: ['Give me a hint without solving it.', 'What should I focus on next in this lesson?'],
    quiz_me: ['Quiz me on the main idea.', 'Ask me two quick questions that check if I am ready to move on.'],
    study_plan: ['Build me a short study plan for this lesson.', 'What should I review first, then practice, then check before moving on?'],
    check_my_answer: [
      'Check my answer: I think the lesson means...',
      'Review this answer and tell me what I missed before the next step.',
    ],
    explain_wrong_answer: ['Help me understand what I missed in this lesson.'],
  };

  return prompts[mode];
}

const quickPrompts = [
  'Explain this lesson in simpler words.',
  'Give me one real example.',
  'Quiz me on the main idea.',
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
  const [providerError, setProviderError] = React.useState<string | null>(null);
  const [sources, setSources] = React.useState(history.data?.sources ?? []);
  const [latestReplySources, setLatestReplySources] = React.useState(history.data?.sources ?? []);
  const [learningContext, setLearningContext] = React.useState(history.data?.learningContext ?? null);
  const [latestStructured, setLatestStructured] = React.useState<AiStructuredResponse | null>(
    history.data?.structured ?? null,
  );
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const isStreamingRef = React.useRef(false);
  const [streamingText, setStreamingText] = React.useState('');

  React.useEffect(() => {
    if (!history.data) return;
    setSessionId(history.data.sessionId ?? undefined);
    setMessages(history.data.messages ?? []);
    setSources(history.data.sources ?? []);
    setLatestReplySources(history.data.sources ?? []);
    setLearningContext(history.data.learningContext ?? null);
    setLatestStructured(history.data.structured ?? null);
  }, [history.data]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, streamingText]);

  const applyPrompt = React.useCallback((input: { text: string; mode?: AiChatMode }) => {
    if (input.mode) setMode(input.mode);
    setText(input.text);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const send = useMutation({
    mutationFn: async (message: string) => {
      if (!message) throw new Error('Type a message');
      return aiApi.lessonChat({ lessonId, message, sessionId, mode });
    },
    onMutate: async (message: string) => {
      if (!message) return;
      setProviderError(null);
      setMessages((current) => [
        ...current,
        {
          id: `temp_${Date.now()}`,
          role: 'user',
          content: message,
          createdAt: new Date().toISOString(),
        },
      ]);
      setText('');
    },
    onSuccess: (response) => {
      setSessionId(response.sessionId);
      setMessages(response.messages);
      setSources(response.sources ?? []);
      setLatestReplySources(response.sources ?? []);
      setLearningContext(response.learningContext ?? null);
      setLatestStructured(response.structured ?? null);
      if (response.providerStatus === 'unavailable') {
        const description = response.errorMessage ?? 'AI provider is unavailable right now.';
        setProviderError(description);
        toast({
          title: 'AI unavailable',
          description,
          variant: 'destructive',
        });
        return;
      }
      if (response.providerStatus === 'fallback') {
        toast({
          title: 'AI tutor fallback mode',
          description:
            response.errorMessage ??
            'Live AI was temporarily unavailable, so this answer was generated from the current lesson content.',
        });
      }
      setProviderError(null);
    },
    onError: (error) => {
      setLatestStructured(null);
      setProviderError(error instanceof Error ? error.message : 'Please try again.');
      toast({
        title: 'AI message failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      setMessages((current) => current.filter((message) => !message.id.startsWith('temp_')));
    },
  });
  const quickPrompts = getLessonQuickPrompts(mode);

  const sendStreaming = async (message: string) => {
    try {
      isStreamingRef.current = true;
      setProviderError(null);
      
      const tempId = `temp_${Date.now()}`;
      setMessages((current) => [
        ...current,
        {
          id: tempId,
          role: 'user',
          content: message,
          createdAt: new Date().toISOString(),
        },
      ]);
      setText('');
      setStreamingText('');

      const token = useAuthStore.getState().accessToken;
      const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/ai/lesson-chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ lessonId, message, sessionId, mode }),
      });

      if (!res.ok) {
        throw new Error(`Stream failed: ${res.status}`);
      }
      
      if (!res.body) {
         throw new Error('No body in response');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed === 'data: [DONE]') {
            isStreamingRef.current = false;
            const historyData = await aiApi.lessonHistory(lessonId);
            setSessionId(historyData.sessionId ?? undefined);
            setMessages(historyData.messages ?? []);
            setSources(historyData.sources ?? []);
            setLatestReplySources(historyData.sources ?? []);
            setLearningContext(historyData.learningContext ?? null);
            setLatestStructured(historyData.structured ?? null);
            setStreamingText('');
            return;
          }
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.error) {
                 throw new Error(data.error);
              }
              if (data.chunk) {
                accumulatedText += data.chunk;
                setStreamingText(accumulatedText);
              }
            } catch (e) {
               // Ignore parse error
            }
          }
        }
      }
    } catch (e: any) {
      console.warn('Streaming failed, falling back to normal:', e);
      isStreamingRef.current = false;
      setStreamingText('');
      setMessages((current) => current.filter((m) => !m.id.startsWith('temp_')));
      send.mutate(message);
    }
  };

  const handleFeedback = async (messageId: string, rating: number) => {
    try {
      if (messageId.startsWith('temp_')) return;
      await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/ai/messages/${messageId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${useAuthStore.getState().accessToken}` },
        body: JSON.stringify({ rating }),
      });
      toast({ title: 'Feedback submitted', description: 'Thank you for your feedback!' });
    } catch {}
  };

  const orbState = send.isPending || isStreamingRef.current ? 'thinking' : providerError ? 'idle' : 'speaking';

  return (
    <div className="rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_40px_var(--site-shadow)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Ai3DOrb state={orbState} size={64} />
          <div>
            <div className="text-2xl font-bold text-[var(--site-text)]">Forge 3D AI</div>
            <div className="mt-0.5 text-sm text-[var(--site-subtle)]">
              {send.isPending
                ? 'Thinking...'
                : history.isLoading
                  ? 'Loading session...'
                  : 'Your interactive 3D tutor'}
            </div>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--site-surface-alt)] px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--site-primary)] shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          3D AI Active
        </div>
      </div>

      <AiLearningContextBanner context={learningContext} />

      <div className="mt-5 flex flex-wrap gap-2">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
              mode === item.id
                ? 'bg-[var(--site-primary)] text-white'
                : 'bg-[var(--site-surface-alt)] text-[var(--site-muted)] hover:bg-[var(--site-primary-soft)] hover:text-[var(--site-primary)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-3 text-sm text-[var(--site-subtle)]">{lessonModeDescriptions[mode]}</div>

      <div className="mt-5 rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--site-text)]">
          <Lightbulb className="h-4 w-4 text-[var(--site-warm)]" />
          Suggested prompts
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setText(prompt)}
              className="rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-left text-sm text-[var(--site-muted)] transition hover:bg-[var(--site-primary-soft)] hover:text-[var(--site-text)]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <AiGroundingPanel title="Grounded in this lesson" sources={sources} />

      <div
        ref={scrollRef}
        className="mt-5 max-h-[260px] space-y-3 overflow-auto rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4"
      >
        {providerError ? (
          <div className="rounded-[1.1rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-4 text-sm text-[var(--site-danger)]">
            {providerError}
          </div>
        ) : null}
        {history.isLoading ? (
          <div className="text-sm text-[var(--site-subtle)]">Loading chat...</div>
        ) : history.isError ? (
          <div className="rounded-[1.1rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-4 text-sm text-[var(--site-danger)]">
            {history.error instanceof Error ? history.error.message : 'Could not load chat'}
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-[1.2rem] bg-[var(--site-surface)] px-4 py-4 text-sm leading-7 text-[var(--site-subtle)]">
            Ask about this lesson and Forge AI will explain it here using the current lesson context.
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-[1.2rem] px-4 py-3 text-sm leading-7 ${
                    message.role === 'user'
                      ? 'bg-[var(--site-primary)] text-white'
                      : 'border border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-muted)]'
                  }`}
                >
                  <div
                    className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${
                      message.role === 'user' ? 'text-white/80' : 'text-[var(--site-subtle)]'
                    }`}
                  >
                    {message.role === 'user' ? 'You' : 'Forge AI'}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap">{message.content}</div>
                  {message.role === 'assistant' && !message.id.startsWith('temp_') && (
                    <div className="mt-3 flex items-center gap-2 border-t border-[var(--site-border)]/50 pt-2">
                      <button
                        onClick={() => handleFeedback(message.id, 5)}
                        className="text-[12px] text-[var(--site-subtle)] hover:text-emerald-500 transition"
                        title="Helpful"
                        type="button"
                      >
                        👍 Helpful
                      </button>
                      <button
                        onClick={() => handleFeedback(message.id, 1)}
                        className="text-[12px] text-[var(--site-subtle)] hover:text-red-500 transition ml-2"
                        title="Not helpful"
                        type="button"
                      >
                        👎 Not helpful
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isStreamingRef.current && streamingText && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-[1.2rem] px-4 py-3 text-sm leading-7 border border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-muted)]">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
                    Forge AI
                  </div>
                  <div className="mt-1 whitespace-pre-wrap">{streamingText}<span className="animate-pulse">|</span></div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!providerError && messages.some((message) => message.role === 'assistant') ? (
        <>
          <AiStructuredPanel data={latestStructured} onApplyPrompt={applyPrompt} />
          <AiSourceChips label="Latest lesson answer grounded in" sources={latestReplySources} />
        </>
      ) : null}

      <form
        className="mt-5 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const message = text.trim();
          if (message.length === 0 || send.isPending || isStreamingRef.current) return;
          sendStreaming(message);
        }}
      >
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Ask Forge AI about this lesson, paste an answer to review, or request a study plan..."
            disabled={send.isPending}
            className="h-12 rounded-full border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 text-[var(--site-text)] placeholder:text-[var(--site-subtle)]"
          />
          <Button
            type="submit"
            disabled={send.isPending || text.trim().length === 0}
            className="h-12 rounded-full bg-[var(--site-primary)] px-5 text-white hover:bg-[var(--site-primary-strong)]"
          >
            <SendHorizonal className="mr-2 h-4 w-4" />
            {send.isPending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
}
