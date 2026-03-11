import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ContentStatus, QuestionType } from '@prisma/client';

import { GamificationService } from '../gamification/gamification.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from '../progress/progress.service';
import { EventsService } from '../events/events.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

const XP_QUIZ_PASS = 50;

@Injectable()
export class QuizzesService {
  private readonly logger = new Logger(QuizzesService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
    private readonly progress: ProgressService,
    private readonly events: EventsService,
  ) {}

  private async assertEnrolled(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new ForbiddenException('Not enrolled');
  }

  private async getLessonQuizOrNull(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: { include: { course: true } },
        quiz: {
          include: {
            questions: {
              where: { deletedAt: null },
              orderBy: { order: 'asc' },
              include: { options: { orderBy: { order: 'asc' } } },
            },
          },
        },
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
    return { lesson, quiz: lesson.quiz };
  }

  async getQuizForLesson(userId: string, lessonId: string) {
    const { lesson, quiz } = await this.getLessonQuizOrNull(lessonId);
    await this.assertEnrolled(userId, lesson.module.courseId);
    if (!quiz || quiz.deletedAt || quiz.status !== ContentStatus.published) return { hasQuiz: false };

    return {
      hasQuiz: true,
      quiz: {
        id: quiz.id,
        lessonId: quiz.lessonId,
        passingScore: quiz.passingScore,
        title: quiz.title,
        questions: quiz.questions.map((q: { id: string; type: string; difficulty: number; prompt: string; order: number; options: Array<{ id: string; text: string; order: number }> }) => ({
          id: q.id,
          type: q.type,
          difficulty: q.difficulty,
          prompt: q.prompt,
          order: q.order,
          options:
            q.type === QuestionType.multiple_choice || q.type === QuestionType.true_false
              ? q.options.map((o: { id: string; text: string; order: number }) => ({ id: o.id, text: o.text, order: o.order }))
              : [],
        })),
      },
    };
  }

  async submitQuizForLesson(userId: string, lessonId: string, dto: SubmitQuizDto) {
    const { lesson, quiz } = await this.getLessonQuizOrNull(lessonId);
    await this.assertEnrolled(userId, lesson.module.courseId);
    if (!quiz || quiz.deletedAt || quiz.status !== ContentStatus.published) {
      throw new NotFoundException('Quiz not found');
    }

    const questions = await this.prisma.question.findMany({
      where: { quizId: quiz.id, deletedAt: null },
      orderBy: { order: 'asc' },
      include: { options: { orderBy: { order: 'asc' } } },
    });
    if (questions.length === 0) throw new BadRequestException('Quiz has no questions');

    type QuestionWithOptions = { id: string; type: string; options: Array<{ id: string; text: string }>; correctOptionId: string | null; explanation: string | null };
    const allowedQids = new Set(questions.map((q: QuestionWithOptions) => q.id));
    const seen = new Set<string>();
    for (const a of dto.answers) {
      if (!allowedQids.has(a.questionId)) throw new BadRequestException('Answer includes unknown questionId');
      if (seen.has(a.questionId)) throw new BadRequestException('Duplicate question answer');
      seen.add(a.questionId);
    }
    const missing = questions.filter((q: QuestionWithOptions) => !seen.has(q.id));
    if (missing.length) throw new BadRequestException('Please answer all questions before submitting');

    type AnswerItem = { questionId: string; selectedOptionId?: string };
    const answerByQ = new Map(dto.answers.map((a: AnswerItem) => [a.questionId, a]));
    const results = questions.map((q: QuestionWithOptions) => {
      const input = answerByQ.get(q.id);
      let isCorrect = false;
      let selectedOptionId: string | null = null;

      if (q.type === QuestionType.multiple_choice || q.type === QuestionType.true_false) {
        if (!input?.selectedOptionId) throw new BadRequestException('Please choose an option for each question');
        selectedOptionId = input.selectedOptionId;
        const optionExists = q.options.some((o: { id: string }) => o.id === selectedOptionId);
        if (!optionExists) throw new BadRequestException('Selected option is invalid for this question');
        isCorrect = Boolean(q.correctOptionId && q.correctOptionId === input.selectedOptionId);
      } else {
        // Future support for short_answer/ordered etc
        throw new BadRequestException(`Unsupported question type: ${q.type}`);
      }

      const correctOption = q.correctOptionId
        ? q.options.find((o: { id: string }) => o.id === q.correctOptionId) ?? null
        : null;
      const selectedOption = selectedOptionId
        ? q.options.find((o: { id: string }) => o.id === selectedOptionId) ?? null
        : null;

      return {
        questionId: q.id,
        isCorrect,
        explanation: q.explanation ?? null,
        correctOption: correctOption ? { id: correctOption.id, text: correctOption.text } : null,
        selectedOption: selectedOption ? { id: selectedOption.id, text: selectedOption.text } : null,
        type: q.type,
      };
    });

    type ResultItem = {
      questionId: string;
      isCorrect: boolean;
      explanation: string | null;
      correctOption: { id: string; text: string } | null;
      selectedOption?: { id: string; text: string } | null;
    };
    const correct = results.filter((r: ResultItem) => r.isCorrect).length;
    const score = Math.round((correct / results.length) * 100);
    const passed = score >= quiz.passingScore;
    this.logger.log(`quiz submitted user=${userId} lesson=${lessonId} quiz=${quiz.id} score=${score} passed=${passed}`);

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId,
        quizId: quiz.id,
        lessonId,
        score,
        passed,
        answers: {
          create: results.map((r: ResultItem) => ({
            questionId: r.questionId,
            selectedOptionId: r.selectedOption?.id ?? null,
            isCorrect: r.isCorrect,
          })),
        },
      },
      include: { answers: true },
    });
    await this.events.track(userId, 'quiz_submitted', { entityType: 'Quiz', entityId: quiz.id, lessonId });

    if (passed) {
      // Award quiz XP once per first pass on this quiz+lesson
      const alreadyPassed = await this.prisma.quizAttempt.findFirst({
        where: { userId, quizId: quiz.id, passed: true, id: { not: attempt.id } },
      });
      if (!alreadyPassed) {
        await this.gamification.awardXp(userId, XP_QUIZ_PASS);
        await this.gamification.maybeAwardFirstQuiz(userId);
      }
      await this.events.track(userId, 'quiz_passed', { entityType: 'Quiz', entityId: quiz.id, lessonId, score });
      // MVP rule: passing quiz auto-completes lesson
      await this.progress.completeLesson(userId, lessonId);
    }

    return {
      attemptId: attempt.id,
      score,
      passed,
      passingScore: quiz.passingScore,
      questions: results.map((r: ResultItem) => ({
        questionId: r.questionId,
        isCorrect: r.isCorrect,
        explanation: r.isCorrect ? null : r.explanation,
        correctOption: r.isCorrect ? null : r.correctOption,
      })),
    };
  }
}

