import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiMessageRole, ContentStatus, QuestionType } from '../../prisma-enums';

import { PrismaService } from '../prisma/prisma.service';
import { AiMode, ProviderChatMessage } from './ai.types';
import { SimpleRateLimiter } from './ai.rate-limit';
import { systemPromptForMode } from './prompt-templates';
import { OpenAiCompatibleProvider } from './providers/openai-compatible.provider';
import { EventsService } from '../events/events.service';

const HISTORY_LIMIT = 8;

function safeText(x: unknown): string {
  if (typeof x !== 'string') return '';
  return x.replace(/\s+/g, ' ').trim();
}

function lessonContextFromBlocks(blocks: Array<{ type: string; content: any }>, maxChars: number) {
  const parts: string[] = [];
  for (const b of blocks) {
    const c = b.content ?? {};
    if (b.type === 'heading') parts.push(`Heading: ${safeText(c.text)}`);
    else if (b.type === 'paragraph') parts.push(safeText(c.text));
    else if (b.type === 'bullet_list') parts.push(`Bullets: ${(c.bullets ?? []).map(safeText).join(' | ')}`);
    else if (b.type === 'example') parts.push(`Example: ${safeText(c.title)} — ${safeText(c.text)}`);
    else if (b.type === 'callout') parts.push(`Callout (${safeText(c.variant)}): ${safeText(c.text)}`);
    else if (b.type === 'recap') parts.push(`Recap: ${(c.bullets ?? []).map(safeText).join(' | ')}`);
    else if (b.type === 'code_block') parts.push(`Code (${safeText(c.language)}): ${safeText(c.code)}`);
    else parts.push(`${b.type}: ${safeText(JSON.stringify(c))}`);

    if (parts.join('\n').length >= maxChars) break;
  }
  const joined = parts.join('\n');
  return joined.length > maxChars ? joined.slice(0, maxChars) : joined;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private limiter: SimpleRateLimiter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly provider: OpenAiCompatibleProvider,
    private readonly events: EventsService,
  ) {
    this.limiter = new SimpleRateLimiter(10, 10 / 60); // 10 requests per minute burst-ish
  }

  private async assertEnrolled(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new ForbiddenException('Not enrolled');
  }

  private async getLessonAccessibleByIdOrSlug(input: { lessonId?: string; lessonSlug?: string }) {
    const where = input.lessonId ? { id: input.lessonId } : input.lessonSlug ? { slug: input.lessonSlug } : null;
    if (!where) throw new BadRequestException('lessonId or lessonSlug is required');

    const lesson = await this.prisma.lesson.findUnique({
      where: where as any,
      include: {
        blocks: { orderBy: { order: 'asc' } },
        module: { include: { course: true } },
      },
    });
    if (!lesson || lesson.deletedAt) throw new NotFoundException('Lesson not found');
    if (lesson.status !== ContentStatus.published) throw new NotFoundException('Lesson not found');
    if (lesson.module.deletedAt || lesson.module.status !== ContentStatus.published) {
      throw new NotFoundException('Lesson not found');
    }
    if (lesson.module.course.deletedAt || lesson.module.course.status !== ContentStatus.published) {
      throw new NotFoundException('Lesson not found');
    }
    return lesson;
  }

  private async getOrCreateSession(userId: string, lessonId: string, sessionId?: string) {
    if (sessionId) {
      const session = await this.prisma.aiSession.findUnique({ where: { id: sessionId } });
      if (!session || session.userId !== userId || session.lessonId !== lessonId) {
        throw new ForbiddenException('Invalid session');
      }
      return session;
    }
    return this.prisma.aiSession.create({
      data: { userId, lessonId, title: 'Lesson chat' },
    });
  }

  private async recentMessagesForSession(sessionId: string) {
    return this.prisma.aiMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 200, // stored history can be long, but we will window it
    });
  }

  async lessonChat(userId: string, input: { lessonId?: string; lessonSlug?: string; sessionId?: string; message: string; mode: AiMode }) {
    if (!this.limiter.tryConsume(userId, 1)) {
      throw new ForbiddenException('Rate limit exceeded');
    }

    const lesson = await this.getLessonAccessibleByIdOrSlug({ lessonId: input.lessonId, lessonSlug: input.lessonSlug });
    await this.assertEnrolled(userId, lesson.module.courseId);

    const session = await this.getOrCreateSession(userId, lesson.id, input.sessionId);
    const stored = await this.recentMessagesForSession(session.id);
    const windowed = stored.slice(Math.max(0, stored.length - HISTORY_LIMIT * 2));

    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    const userName = profile?.fullName ?? 'Student';
    const userLevel = profile?.level ?? 1;

    const maxContextChars = 3500;
    const lessonCtx = lessonContextFromBlocks(
      lesson.blocks.map((b) => ({ type: b.type, content: b.content })),
      maxContextChars,
    );

    const system = systemPromptForMode(input.mode);
    const context = [
      `Lesson title: ${lesson.title}`,
      lesson.learningObjective ? `Objective: ${lesson.learningObjective}` : '',
      `Student name: ${userName}`,
      `Student level: ${userLevel}`,
      `Lesson content:\n${lessonCtx}`,
      lesson.aiPromptSeed ? `Teacher notes:\n${lesson.aiPromptSeed}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const messages: ProviderChatMessage[] = [
      { role: 'system', content: system },
      { role: 'system', content: context },
      ...windowed
        .filter((m) => m.role === AiMessageRole.user || m.role === AiMessageRole.assistant)
        .map<ProviderChatMessage>((m) => ({
          role: (m.role === AiMessageRole.user ? 'user' : 'assistant') as ProviderChatMessage['role'],
          content: m.content,
        })),
      { role: 'user' as const, content: input.message },
    ];

    // Persist user message first
    const userMsg = await this.prisma.aiMessage.create({
      data: { sessionId: session.id, role: AiMessageRole.user, content: input.message },
    });
    await this.events.track(userId, 'ai_message_sent', { entityType: 'Lesson', entityId: lesson.id, sessionId: session.id, mode: input.mode });

    let assistantText = '';
    try {
      const out = await this.provider.chat({
        messages,
        maxOutputTokens: Number(this.config.get('AI_MAX_OUTPUT_TOKENS') ?? 800),
        temperature: 0.4,
      });
      assistantText = out.text || 'I can help—could you rephrase your question?';
    } catch (e: any) {
      this.logger.warn(`ai provider failure user=${userId} lesson=${lesson.id} session=${session.id}`);
      assistantText =
        'I’m having trouble reaching the AI provider right now. Please try again in a moment.';
    }

    const assistantMsg = await this.prisma.aiMessage.create({
      data: { sessionId: session.id, role: AiMessageRole.assistant, content: assistantText },
    });

    return {
      sessionId: session.id,
      reply: assistantText,
      messages: [
        { id: userMsg.id, role: 'user', content: userMsg.content, createdAt: userMsg.createdAt },
        { id: assistantMsg.id, role: 'assistant', content: assistantMsg.content, createdAt: assistantMsg.createdAt },
      ],
    };
  }

  async lessonHistory(userId: string, lessonId: string) {
    const lesson = await this.getLessonAccessibleByIdOrSlug({ lessonId });
    await this.assertEnrolled(userId, lesson.module.courseId);

    const session = await this.prisma.aiSession.findFirst({
      where: { userId, lessonId },
      orderBy: { updatedAt: 'desc' },
    });
    if (!session) return { sessionId: null, messages: [] as any[] };

    const messages = await this.prisma.aiMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });

    return {
      sessionId: session.id,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role === AiMessageRole.user ? 'user' : m.role === AiMessageRole.assistant ? 'assistant' : 'system',
        content: m.content,
        createdAt: m.createdAt,
      })),
    };
  }

  async explainWrongAnswer(userId: string, input: { lessonId: string; questionId: string; selectedOptionId?: string; userAnswerText?: string }) {
    if (!this.limiter.tryConsume(`${userId}:explain`, 1)) {
      throw new ForbiddenException('Rate limit exceeded');
    }

    const lesson = await this.getLessonAccessibleByIdOrSlug({ lessonId: input.lessonId });
    await this.assertEnrolled(userId, lesson.module.courseId);

    const question = await this.prisma.question.findUnique({
      where: { id: input.questionId },
      include: { options: { orderBy: { order: 'asc' } }, quiz: true },
    });
    if (!question || question.deletedAt) throw new NotFoundException('Question not found');
    if (!question.quiz || question.quiz.lessonId !== lesson.id) throw new BadRequestException('Question not in lesson');

    if (question.type !== QuestionType.multiple_choice && question.type !== QuestionType.true_false) {
      throw new BadRequestException('Unsupported question type');
    }

    const selected = input.selectedOptionId
      ? question.options.find((o) => o.id === input.selectedOptionId) ?? null
      : null;
    const correct = question.correctOptionId
      ? question.options.find((o) => o.id === question.correctOptionId) ?? null
      : null;

    const system = systemPromptForMode('explain_wrong_answer');
    const context = [
      `Lesson title: ${lesson.title}`,
      question.prompt ? `Question: ${question.prompt}` : '',
      selected ? `User answered: ${selected.text}` : input.userAnswerText ? `User answered: ${input.userAnswerText}` : 'User answered: (missing)',
      correct ? `Correct answer: ${correct.text}` : 'Correct answer: (unknown)',
      question.explanation ? `Official explanation: ${question.explanation}` : '',
      lesson.aiPromptSeed ? `Teacher notes:\n${lesson.aiPromptSeed}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    let text = '';
    try {
      const out = await this.provider.chat({
        messages: [
          { role: 'system', content: system },
          { role: 'system', content: context },
          { role: 'user', content: 'Explain why the answer was wrong and how to get it right next time.' },
        ],
        maxOutputTokens: 400,
        temperature: 0.3,
      });
      text = out.text || 'Try reviewing the lesson and focusing on the key definition used in this question.';
    } catch {
      text = 'AI is unavailable right now. Please try again shortly.';
    }

    return { explanation: text };
  }
}

