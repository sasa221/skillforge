'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Bot, HelpCircle, Lock, SendHorizonal, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/toast/toast-provider';
import { aiApi } from '@/lib/api/endpoints';
import type { AiChatMessage, AiChatMode, AiStructuredResponse } from '@/lib/content/types';
import { cn } from '@/lib/utils';
import { AiGroundingPanel } from './AiGroundingPanel';
import { AiLearningContextBanner } from './AiLearningContextBanner';
import { AiSourceChips } from './AiSourceChips';
import { AiStructuredPanel } from './AiStructuredPanel';

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

const courseModeDescriptions: Record<AiChatMode, string> = {
  explain: 'Breaks the current module or lesson focus into clear steps using the course material.',
  simplify: 'Rephrases the current idea in plain language with your next step in mind.',
  give_example: 'Gives a practical example that matches this course.',
  summarize: 'Turns the current course flow into a short recap focused on what matters right now.',
  hint: 'Gives a nudge toward the next lesson or checkpoint without fully solving it.',
  quiz_me: 'Asks short questions from your current module or upcoming checkpoint, then waits for your answer.',
  study_plan: 'Builds a short study plan around your current module, next lesson, and any checkpoint gate.',
  check_my_answer: 'Reviews your answer against your current module, next lesson, and checkpoint expectations.',
  explain_wrong_answer: 'Explains mistakes and how to avoid them next time.',
};

function getCourseQuickPrompts(courseTitle: string, mode: AiChatMode) {
  const prompts: Record<AiChatMode, string[]> = {
    explain: [`Explain the hardest concept in ${courseTitle} in simple words.`, `Walk me through this course step by step.`],
    simplify: [`Simplify the main idea in ${courseTitle}.`, `Explain this course like I am a beginner.`],
    give_example: [`Give me one real example from ${courseTitle}.`, `Show me how this course applies in practice.`],
    summarize: [`Summarize the course roadmap for me.`, `Give me a short recap of what matters most in ${courseTitle}.`],
    hint: [`Give me a hint on what to study next in ${courseTitle}.`, `If a checkpoint is coming, point me toward it without solving it.`],
    quiz_me: [
      `Quiz me on the module I am currently working through in ${courseTitle}.`,
      `Ask me three quick questions that prepare me for the next checkpoint in this course.`,
    ],
    study_plan: [
      `Build me a 20-minute study plan for ${courseTitle} based on my current module.`,
      `What should I study next, and is there a checkpoint I need to clear first?`,
    ],
    check_my_answer: [
      'Check my answer against the module I am currently working through: I think the key idea is...',
      'Review this answer and tell me what is missing before I move to the next lesson.',
    ],
    explain_wrong_answer: ['Help me understand what I missed in this course.'],
  };

  return prompts[mode];
}

export function CourseAiPanel({
  courseId,
  courseTitle,
  unlocked,
  ctaHref = '/courses',
  ctaLabel = 'Browse courses',
  className,
}: {
  courseId?: string;
  courseTitle: string;
  unlocked: boolean;
  ctaHref?: string;
  ctaLabel?: string;
  className?: string;
}) {
  const { toast } = useToast();

  if (!unlocked || !courseId) {
    return (
      <div
        className={cn(
          'rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_40px_var(--site-shadow)]',
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-surface-alt)] text-[var(--site-muted)]">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[var(--site-text)]">Forge AI tutor</div>
            <div className="mt-1 text-sm text-[var(--site-muted)]">
              Enroll first to unlock your course tutor.
            </div>
          </div>
        </div>
        <div className="mt-5 rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4 text-sm leading-7 text-[var(--site-muted)]">
          Once unlocked, this panel can explain the course point by point, build a study plan, review an answer,
          quiz the learner, and connect ideas across multiple lessons.
        </div>
        <Link
          href={ctaHref}
          className="mt-5 inline-flex items-center rounded-full bg-[var(--site-primary)] px-5 py-3 text-sm font-semibold text-white"
        >
          {ctaLabel}
        </Link>
      </div>
    );
  }

  return <LiveCourseAiPanel courseId={courseId} courseTitle={courseTitle} className={className} />;
}

function LiveCourseAiPanel({
  courseId,
  courseTitle,
  className,
}: {
  courseId: string;
  courseTitle: string;
  className?: string;
}) {
  const { toast } = useToast();
  const history = useQuery({
    queryKey: ['ai', 'course', courseId, 'history'],
    queryFn: () => aiApi.courseHistory(courseId),
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
  }, [messages.length]);

  const applyPrompt = React.useCallback((input: { text: string; mode?: AiChatMode }) => {
    if (input.mode) setMode(input.mode);
    setText(input.text);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const send = useMutation({
    mutationFn: async (message: string) => {
      if (!message) throw new Error('Type a message');
      return aiApi.courseChat({ courseId, message, sessionId, mode });
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
          title: 'AI tutor unavailable',
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
            'Live AI was temporarily unavailable, so this answer was generated from the current course content.',
        });
      }
      setProviderError(null);
    },
    onError: (error) => {
      setLatestStructured(null);
      setProviderError(error instanceof Error ? error.message : 'Please try again.');
      toast({
        title: 'AI tutor failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
      setMessages((current) => current.filter((message) => !message.id.startsWith('temp_')));
    },
  });
  const quickPrompts = getCourseQuickPrompts(courseTitle, mode);

  return (
    <div
      className={cn(
        'rounded-[1.9rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_18px_40px_var(--site-shadow)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--site-text)]">Forge AI tutor</div>
            <div className="mt-1 text-sm text-[var(--site-muted)]">
              {send.isPending
                ? 'Thinking...'
                : history.isLoading
                  ? 'Loading your course session...'
                  : 'Course-specific help for explanations, examples, and quick quizzes'}
            </div>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--site-surface-alt)] px-3 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--site-subtle)]">
          <Sparkles className="h-3.5 w-3.5" />
          AI tutor
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
      <div className="mt-3 text-sm text-[var(--site-subtle)]">{courseModeDescriptions[mode]}</div>

      <div className="mt-5 rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--site-text)]">
          <HelpCircle className="h-4 w-4 text-[var(--site-warm)]" />
          Suggested prompts
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setText(prompt)}
              className="rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-left text-sm text-[var(--site-muted)] transition hover:bg-[var(--site-primary-soft)] hover:text-[var(--site-primary)]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <AiGroundingPanel title="Grounded in this course" sources={sources} />

      <div
        ref={scrollRef}
        className="mt-5 max-h-[320px] space-y-3 overflow-auto rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4"
      >
        {providerError ? (
          <div className="rounded-[1.1rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-4 text-sm text-[var(--site-danger)]">
            {providerError}
          </div>
        ) : null}
        {history.isLoading ? (
          <div className="text-sm text-[var(--site-muted)]">Loading chat...</div>
        ) : history.isError ? (
          <div className="rounded-[1.1rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-4 text-sm text-[var(--site-danger)]">
            {history.error instanceof Error ? history.error.message : 'Could not load chat'}
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-[1.2rem] bg-[var(--site-surface)] px-4 py-4 text-sm leading-7 text-[var(--site-muted)]">
            Ask about this course and the tutor will help using the course outline, lesson flow, and your chat history.
          </div>
        ) : (
          messages.map((message) => (
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
              </div>
            </div>
          ))
        )}
      </div>

      {!providerError && messages.some((message) => message.role === 'assistant') ? (
        <>
          <AiStructuredPanel data={latestStructured} onApplyPrompt={applyPrompt} />
          <AiSourceChips sources={latestReplySources} />
        </>
      ) : null}

      <form
        className="mt-5 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const message = text.trim();
          if (message.length === 0 || send.isPending) return;
          send.mutate(message);
        }}
      >
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Ask about the course, request a quiz, paste an answer to review, or ask for a study plan..."
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
