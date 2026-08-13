import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AiMessageRole, ContentStatus, QuestionType } from '../../prisma-enums';

import { LearningAccessService } from '../learning-access/learning-access.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AiLearningContext,
  AiMode,
  AiProviderStatus,
  AiSourceReference,
  AiStructuredResponse,
  ProviderChatMessage,
} from './ai.types';
import { deriveModuleProgressState } from '../progress/module-progress.util';
import { AiRateLimiter, RedisBackedRateLimiter, SimpleRateLimiter } from './ai.rate-limit';
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
    else if (b.type === 'image') parts.push(`Image: ${safeText(c.alt ?? c.title ?? c.caption ?? c.url)}`);
    else if (b.type === 'video') parts.push(`Video: ${safeText(c.title ?? c.caption ?? c.transcript ?? c.url)}`);
    else parts.push(`${b.type}: ${safeText(JSON.stringify(c))}`);

    if (parts.join('\n').length >= maxChars) break;
  }
  const joined = parts.join('\n');
  return joined.length > maxChars ? joined.slice(0, maxChars) : joined;
}

function mapStoredMessages(
  messages: Array<{ id: string; role: string; content: string; createdAt: Date }>,
) {
  return messages.map((message) => ({
    id: message.id,
    role:
      message.role === AiMessageRole.user
        ? ('user' as const)
        : message.role === AiMessageRole.assistant
          ? ('assistant' as const)
          : ('system' as const),
    content: message.content,
    createdAt: message.createdAt,
  }));
}

function courseContextFromCourse(
  course: {
    title: string;
    description: string | null;
    skills: Array<{ skill: { title: string } }>;
    modules: Array<{
      title: string;
      description: string | null;
      lessons: Array<{
        title: string;
        learningObjective: string | null;
        blocks: Array<{ type: string; content: any }>;
      }>;
    }>;
  },
  maxChars: number,
) {
  const parts: string[] = [];

  parts.push(`Course title: ${safeText(course.title)}`);
  if (course.description) parts.push(`Course summary: ${safeText(course.description)}`);
  if (course.skills.length > 0) {
    parts.push(`Skills: ${course.skills.map((item) => safeText(item.skill.title)).join(' | ')}`);
  }

  outer: for (const module of course.modules) {
    parts.push(`Module: ${safeText(module.title)}`);
    if (module.description) parts.push(`Module summary: ${safeText(module.description)}`);

    for (const lesson of module.lessons) {
      parts.push(`Lesson: ${safeText(lesson.title)}`);
      if (lesson.learningObjective) {
        parts.push(`Lesson objective: ${safeText(lesson.learningObjective)}`);
      }

      const lessonPreview = lessonContextFromBlocks(
        lesson.blocks.map((block) => ({ type: block.type, content: block.content })),
        320,
      );
      if (lessonPreview) {
        parts.push(`Lesson preview: ${lessonPreview}`);
      }

      if (parts.join('\n').length >= maxChars) {
        break outer;
      }
    }
  }

  const joined = parts.join('\n');
  return joined.length > maxChars ? joined.slice(0, maxChars) : joined;
}

function snippetFromBlocks(blocks: Array<{ type: string; content: any }>, maxChars: number) {
  const text = lessonContextFromBlocks(blocks, maxChars);
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}

function courseOutlineFromCourse(
  course: {
    modules: Array<{
      title: string;
      lessons: Array<{
        title: string;
      }>;
    }>;
  },
  maxChars: number,
) {
  const lines: string[] = [];

  for (const module of course.modules) {
    const lessonTitles = module.lessons.map((lesson) => safeText(lesson.title)).filter(Boolean);
    lines.push(
      lessonTitles.length > 0
        ? `- ${safeText(module.title)}: ${lessonTitles.join(' | ')}`
        : `- ${safeText(module.title)}`,
    );

    if (lines.join('\n').length >= maxChars) break;
  }

  const joined = lines.join('\n');
  return joined.length > maxChars ? joined.slice(0, maxChars) : joined;
}

function normalizeListItem(line: string) {
  return line.replace(/^[-*•]\s*/, '').replace(/^\d+[\.)]\s*/, '').trim();
}

function sectionMapFromText(text: string) {
  const sections: Record<string, string[]> = {};
  let current = 'body';

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\*\*/g, '').trim();
    if (!line) continue;

    const heading = line.match(
      /^(Focus|Study plan|Check for understanding|Quiz|How to answer|Verdict|What is correct|What is missing|How to improve|Why this answer misses|Correct answer|Memory tip|What to try next):\s*(.*)$/i,
    );
    if (heading) {
      current = heading[1].toLowerCase();
      sections[current] ??= [];
      if (heading[2]) {
        sections[current].push(heading[2].trim());
      }
      continue;
    }

    sections[current] ??= [];
    sections[current].push(line);
  }

  return sections;
}

function listFromSection(lines: string[] | undefined) {
  return (lines ?? []).map(normalizeListItem).filter(Boolean);
}

function fallbackItemsFromText(text: string, maxItems: number) {
  return text
    .split(/\r?\n+/)
    .map(normalizeListItem)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function inferVerdict(text: string) {
  const normalized = text.toLowerCase();
  if (
    normalized.includes('mostly correct') ||
    normalized.includes('strong answer') ||
    normalized.includes('good answer')
  ) {
    return 'Strong start';
  }
  if (
    normalized.includes('partly correct') ||
    normalized.includes('partial') ||
    normalized.includes('on the right track')
  ) {
    return 'Partly correct';
  }
  if (
    normalized.includes('missing') ||
    normalized.includes('not quite') ||
    normalized.includes('needs work')
  ) {
    return 'Needs revision';
  }
  return null;
}

function confidenceFromVerdict(verdict: string | null) {
  const normalized = verdict?.toLowerCase() ?? '';
  if (normalized.includes('strong') || normalized.includes('good')) {
    return { label: 'High confidence', score: 82 };
  }
  if (normalized.includes('partly') || normalized.includes('partial')) {
    return { label: 'Medium confidence', score: 58 };
  }
  if (normalized.includes('needs') || normalized.includes('revision')) {
    return { label: 'Low confidence', score: 34 };
  }
  return { label: null, score: null };
}

type AiProgressContextOptions = {
  progressNote?: string | null;
  currentModuleLabel?: string | null;
  nextStepLabel?: string | null;
  checkpointPending?: boolean;
  currentModuleTitle?: string | null;
  nextLessonTitle?: string | null;
  checkpointLessonTitle?: string | null;
};

function buildCourseLearningContext(
  courseTitle: string,
  options?: AiProgressContextOptions,
): AiLearningContext {
  return {
    scope: 'course',
    courseTitle,
    currentModuleLabel: options?.currentModuleLabel ?? null,
    currentLessonLabel: options?.checkpointPending
      ? options?.checkpointLessonTitle
        ? `Checkpoint: ${options.checkpointLessonTitle}`
        : null
      : options?.nextLessonTitle
        ? `Current lesson focus: ${options.nextLessonTitle}`
        : null,
    nextStepLabel: options?.nextStepLabel ?? null,
    progressNote: options?.progressNote ?? null,
    checkpointPending: options?.checkpointPending ?? false,
  };
}

function buildLessonLearningContext(input: {
  courseTitle: string;
  moduleOrder: number | null;
  moduleTitle: string;
  lessonTitle: string;
  progressNote?: string | null;
  nextStepLabel?: string | null;
  checkpointPending?: boolean;
}): AiLearningContext {
  return {
    scope: 'lesson',
    courseTitle: input.courseTitle,
    currentModuleLabel:
      input.moduleOrder !== null ? `Module ${input.moduleOrder + 1}: ${input.moduleTitle}` : input.moduleTitle,
    currentLessonLabel: `Current lesson: ${input.lessonTitle}`,
    nextStepLabel: input.nextStepLabel ?? null,
    progressNote: input.progressNote ?? null,
    checkpointPending: input.checkpointPending ?? false,
  };
}

function structuredResponseFromText(
  text: string,
  mode?: AiMode,
  options?: AiProgressContextOptions,
): AiStructuredResponse | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const sections = sectionMapFromText(trimmed);

  if (
    mode === 'quiz_me' ||
    Object.prototype.hasOwnProperty.call(sections, 'quiz') ||
    Object.prototype.hasOwnProperty.call(sections, 'how to answer')
  ) {
    const questions = listFromSection(sections.quiz);
    const answerPrompt =
      sections['how to answer']?.map((line) => normalizeListItem(line)).find(Boolean) ??
      'Reply in chat with your answers, and I will review them with you.';

    return {
      type: 'quiz',
      progressNote: options?.progressNote ?? null,
      currentModuleLabel: options?.currentModuleLabel ?? null,
      nextStepLabel: options?.nextStepLabel ?? null,
      checkpointPending: options?.checkpointPending ?? false,
      questions:
        questions.length > 0
          ? questions
          : trimmed
              .split(/\r?\n+/)
              .map(normalizeListItem)
              .filter((line) => line.includes('?'))
              .slice(0, 3),
      answerPrompt,
    };
  }

  if (
    mode === 'study_plan' ||
    Object.prototype.hasOwnProperty.call(sections, 'study plan') ||
    Object.prototype.hasOwnProperty.call(sections, 'check for understanding')
  ) {
    const body = listFromSection(sections.body);
    const focus = sections.focus?.map((line) => normalizeListItem(line)).find(Boolean) ?? body[0] ?? null;
    const steps = listFromSection(sections['study plan']);
    const checks = listFromSection(sections['check for understanding']);

    return {
      type: 'study_plan',
      focus,
      progressNote: options?.progressNote ?? null,
      currentModuleLabel: options?.currentModuleLabel ?? null,
      nextStepLabel: options?.nextStepLabel ?? null,
      checkpointPending: options?.checkpointPending ?? false,
      steps: steps.length > 0 ? steps : fallbackItemsFromText(trimmed, 4),
      checkForUnderstanding: checks.length > 0 ? checks : fallbackItemsFromText(trimmed, 2).slice(0, 2),
    };
  }

  if (
    mode === 'check_my_answer' ||
    Object.prototype.hasOwnProperty.call(sections, 'verdict') ||
    Object.prototype.hasOwnProperty.call(sections, 'what is correct') ||
    Object.prototype.hasOwnProperty.call(sections, 'what is missing') ||
    Object.prototype.hasOwnProperty.call(sections, 'how to improve')
  ) {
    const verdict = sections.verdict?.map((line) => normalizeListItem(line)).find(Boolean) ?? inferVerdict(trimmed);
    const confidence = confidenceFromVerdict(verdict);

    return {
      type: 'check_my_answer',
      progressNote: options?.progressNote ?? null,
      currentModuleLabel: options?.currentModuleLabel ?? null,
      nextStepLabel: options?.nextStepLabel ?? null,
      checkpointPending: options?.checkpointPending ?? false,
      verdict,
      confidenceLabel: confidence.label,
      confidenceScore: confidence.score,
      correct: listFromSection(sections['what is correct']),
      missing: listFromSection(sections['what is missing']),
      improve: listFromSection(sections['how to improve']),
    };
  }

  if (
    mode === 'explain_wrong_answer' ||
    Object.prototype.hasOwnProperty.call(sections, 'why this answer misses') ||
    Object.prototype.hasOwnProperty.call(sections, 'correct answer') ||
    Object.prototype.hasOwnProperty.call(sections, 'memory tip') ||
    Object.prototype.hasOwnProperty.call(sections, 'what to try next')
  ) {
    const verdict = sections.verdict?.map((line) => normalizeListItem(line)).find(Boolean) ?? inferVerdict(trimmed);
    const correctAnswer = sections['correct answer']?.map((line) => normalizeListItem(line)).find(Boolean) ?? null;

    return {
      type: 'explain_wrong_answer',
      progressNote: options?.progressNote ?? null,
      currentModuleLabel: options?.currentModuleLabel ?? null,
      nextStepLabel: options?.nextStepLabel ?? null,
      checkpointPending: options?.checkpointPending ?? false,
      verdict,
      whyWrong: listFromSection(sections['why this answer misses']),
      correctAnswer,
      memoryTips: listFromSection(sections['memory tip']),
      nextTry: listFromSection(sections['what to try next']),
    };
  }

  return null;
}

function latestAssistantStructuredResponse(
  messages: Array<{ role: string; content: string }>,
  mode?: AiMode,
) {
  const latestAssistant = [...messages].reverse().find((message) => message.role === AiMessageRole.assistant);
  return latestAssistant ? structuredResponseFromText(latestAssistant.content, mode) : null;
}

function lessonSourcesFromLesson(
  lesson: {
    id: string;
    title: string;
    learningObjective: string | null;
    blocks: Array<{ type: string; content: any }>;
    module: {
      id: string;
      title: string;
      description: string | null;
      course: {
        id: string;
        title: string;
        description: string | null;
      };
    };
  },
): AiSourceReference[] {
  return [
    {
      id: `course:${lesson.module.course.id}`,
      kind: 'course' as const,
      title: lesson.module.course.title,
      subtitle: 'Course',
      snippet: safeText(lesson.module.course.description),
    },
    {
      id: `module:${lesson.module.id}`,
      kind: 'module' as const,
      title: lesson.module.title,
      subtitle: `Module in ${lesson.module.course.title}`,
      snippet: safeText(lesson.module.description),
    },
    {
      id: `lesson:${lesson.id}`,
      kind: 'lesson' as const,
      title: lesson.title,
      subtitle: `Lesson in ${lesson.module.title}`,
      snippet:
        safeText(lesson.learningObjective) ||
        snippetFromBlocks(lesson.blocks.map((block) => ({ type: block.type, content: block.content })), 180),
    },
  ].filter((source) => Boolean(source.title && (source.snippet || source.subtitle)));
}

function courseSourcesFromCourse(
  course: {
    id: string;
    title: string;
    description: string | null;
    modules: Array<{
      id: string;
      title: string;
      description: string | null;
      lessons: Array<{
        title: string;
        learningObjective: string | null;
        blocks: Array<{ type: string; content: any }>;
      }>;
    }>;
  },
): AiSourceReference[] {
  const moduleSources = course.modules.slice(0, 3).map<AiSourceReference>((module) => ({
    id: `module:${module.id}`,
    kind: 'module' as const,
    title: module.title,
    subtitle: `Module in ${course.title}`,
    snippet:
      safeText(module.description) ||
      safeText(module.lessons[0]?.learningObjective) ||
      snippetFromBlocks(
        (module.lessons[0]?.blocks ?? []).map((block) => ({ type: block.type, content: block.content })),
        160,
      ),
  }));

  return [
    {
      id: `course:${course.id}`,
      kind: 'course' as const,
      title: course.title,
      subtitle: 'Course',
      snippet: safeText(course.description),
    },
    ...moduleSources,
  ].filter((source) => Boolean(source.title && (source.snippet || source.subtitle)));
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = safeText(value);
    if (normalized) return normalized;
  }
  return null;
}

function dedupeItems(items: Array<string | null | undefined>, maxItems: number) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const item of items) {
    const value = safeText(item);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(value);
    if (normalized.length >= maxItems) break;
  }

  return normalized;
}

function keyIdeasFromBlocks(blocks: Array<{ type: string; content: any }>, maxItems: number) {
  const ideas: Array<string | null | undefined> = [];

  for (const block of blocks) {
    const content = block.content ?? {};
    if (block.type === 'heading') ideas.push(content.text);
    else if (block.type === 'paragraph') ideas.push(content.text);
    else if (block.type === 'bullet_list') ideas.push(...(content.bullets ?? []));
    else if (block.type === 'example') ideas.push(content.title, content.text);
    else if (block.type === 'callout') ideas.push(content.text);
    else if (block.type === 'recap') ideas.push(...(content.bullets ?? []));

    if (ideas.length >= maxItems * 2) break;
  }

  return dedupeItems(
    ideas.map((idea) => {
      const text = safeText(idea);
      if (!text) return null;
      const sentence = text.split(/(?<=[.!?])\s+/)[0]?.trim() ?? text;
      return sentence.length > 140 ? `${sentence.slice(0, 137).trim()}...` : sentence;
    }),
    maxItems,
  );
}

function quizTextFromStructured(structured: Extract<AiStructuredResponse, { type: 'quiz' }>) {
  const quizLines = structured.questions.map((question, index) => `${index + 1}. ${question}`);
  return [
    structured.progressNote ? `Progress: ${structured.progressNote}` : '',
    structured.currentModuleLabel ? `Current module: ${structured.currentModuleLabel}` : '',
    structured.nextStepLabel ? `Next step: ${structured.nextStepLabel}` : '',
    structured.checkpointPending ? 'Checkpoint: A checkpoint is the next gate after this lesson set.' : '',
    'Quiz:',
    ...quizLines,
    '',
    `How to answer: ${structured.answerPrompt ?? 'Reply in chat with your answers.'}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function studyPlanTextFromStructured(structured: Extract<AiStructuredResponse, { type: 'study_plan' }>) {
  const lines = [
    `Focus: ${structured.focus ?? 'Review the current lesson or course carefully.'}`,
    structured.progressNote ? `Progress: ${structured.progressNote}` : '',
    structured.currentModuleLabel ? `Current module: ${structured.currentModuleLabel}` : '',
    structured.nextStepLabel ? `Next step: ${structured.nextStepLabel}` : '',
    structured.checkpointPending ? 'Checkpoint: Pass the current checkpoint before unlocking the next module.' : '',
    'Study plan:',
    ...structured.steps.map((step, index) => `${index + 1}. ${step}`),
    '',
    'Check for understanding:',
    ...structured.checkForUnderstanding.map((check) => `- ${check}`),
  ].filter(Boolean);

  return lines.join('\n');
}

function fallbackStructuredForLesson(
  lesson: {
    title: string;
    learningObjective: string | null;
    blocks: Array<{ type: string; content: any }>;
  },
  mode: AiMode,
): AiStructuredResponse | null {
  const keyIdeas = keyIdeasFromBlocks(lesson.blocks, 3);
  const objective = firstNonEmpty(lesson.learningObjective, keyIdeas[0], lesson.title);

  if (mode === 'quiz_me') {
    return {
      type: 'quiz',
      progressNote: null,
      currentModuleLabel: null,
      nextStepLabel: null,
      checkpointPending: false,
      questions: dedupeItems(
        [
          `What is the main goal of "${lesson.title}"?`,
          objective ? `In your own words, how would you explain this idea: ${objective}?` : null,
          keyIdeas[1]
            ? `How would you use this lesson idea in practice: ${keyIdeas[1]}?`
            : `Give one simple example that matches "${lesson.title}".`,
        ],
        3,
      ),
      answerPrompt: 'Reply with your answers in chat and I will review them with you.',
    };
  }

  if (mode === 'study_plan') {
    return {
      type: 'study_plan',
      focus: objective,
      progressNote: null,
      currentModuleLabel: null,
      nextStepLabel: null,
      checkpointPending: false,
      steps: dedupeItems(
        [
          `Start by restating the main idea of "${lesson.title}" in your own words.`,
          keyIdeas[0] ? `Review this key point carefully: ${keyIdeas[0]}` : null,
          keyIdeas[1] ? `Practice with this supporting idea: ${keyIdeas[1]}` : null,
          'Finish by answering one quick self-check question without looking at the notes.',
        ],
        4,
      ),
      checkForUnderstanding: dedupeItems(
        [
          `Can you explain "${lesson.title}" without reading from the lesson?`,
          objective ? `Can you connect your explanation back to this objective: ${objective}?` : null,
        ],
        2,
      ),
    };
  }

  if (mode === 'check_my_answer') {
    return {
      type: 'check_my_answer',
      progressNote: null,
      currentModuleLabel: null,
      nextStepLabel: null,
      checkpointPending: false,
      verdict: objective ? `Keep your answer tied closely to ${objective}.` : 'Good start, but anchor your answer to the lesson objective.',
      confidenceLabel: 'Medium confidence',
      confidenceScore: 55,
      correct: dedupeItems(
        [
          objective ? `Your answer should stay centered on this lesson goal: ${objective}` : null,
          keyIdeas[0] ? `One strong point to mention is: ${keyIdeas[0]}` : null,
        ],
        2,
      ),
      missing: dedupeItems(
        [
          keyIdeas[1] ? `You may still need to mention: ${keyIdeas[1]}` : null,
          keyIdeas[2] ? `A stronger answer could also connect to: ${keyIdeas[2]}` : null,
        ],
        2,
      ),
      improve: dedupeItems(
        [
          `Rewrite your answer in 2-3 sentences using the exact language of "${lesson.title}" where appropriate.`,
          'Finish with one practical example or plain-language takeaway.',
        ],
        2,
      ),
    };
  }

  return null;
}

function fallbackStructuredForCourse(
  course: {
    title: string;
    modules: Array<{
      title: string;
      description: string | null;
      lessons: Array<{
        title: string;
        learningObjective: string | null;
        blocks: Array<{ type: string; content: any }>;
      }>;
    }>;
  },
  mode: AiMode,
  options?: AiProgressContextOptions & { nextStepNote?: string | null },
): AiStructuredResponse | null {
  const firstModule = course.modules[0] ?? null;
  const currentModule =
    course.modules.find((module) => safeText(module.title) === safeText(options?.currentModuleTitle)) ?? firstModule ?? null;
  const currentModuleIndex = currentModule ? course.modules.findIndex((module) => module.title === currentModule.title) : -1;
  const nextModule = currentModuleIndex >= 0 ? course.modules[currentModuleIndex + 1] ?? null : course.modules[1] ?? null;
  const currentLesson =
    currentModule?.lessons.find((lesson) => safeText(lesson.title) === safeText(options?.nextLessonTitle ?? options?.checkpointLessonTitle)) ??
    currentModule?.lessons[0] ??
    null;
  const nextLesson = nextModule?.lessons[0] ?? null;
  const focus = firstNonEmpty(
    options?.nextStepNote,
    currentLesson?.learningObjective,
    currentModule?.description,
    `Build steady progress in ${course.title}`,
  );

  if (mode === 'quiz_me') {
    return {
      type: 'quiz',
      progressNote: options?.progressNote ?? null,
      currentModuleLabel: options?.currentModuleLabel ?? null,
      nextStepLabel: options?.nextStepLabel ?? null,
      checkpointPending: options?.checkpointPending ?? false,
      questions: dedupeItems(
        [
          options?.checkpointPending && options?.checkpointLessonTitle
            ? `Before moving on, what checkpoint should you pass next in "${course.title}"?`
            : currentModule
              ? `Which module should you focus on right now in "${course.title}"?`
              : `Which module should you focus on first in "${course.title}" to build the right foundation?`,
          currentModule
            ? `What is the main goal of "${currentModule.title}"?`
            : null,
          currentLesson
            ? `What is one important idea or objective in "${currentLesson.title}"?`
            : null,
          options?.checkpointPending
            ? `What should you prove in the checkpoint before "${nextModule?.title ?? 'the next module'}" unlocks?`
            : nextModule
              ? `After "${currentModule?.title ?? 'the current module'}", what new skill does "${nextModule.title}" add?`
              : null,
        ],
        3,
      ),
      answerPrompt: 'Reply in chat with your answers, and I will review them step by step.',
    };
  }

  if (mode === 'study_plan') {
    return {
      type: 'study_plan',
      focus,
      progressNote: options?.progressNote ?? null,
      currentModuleLabel: options?.currentModuleLabel ?? null,
      nextStepLabel: options?.nextStepLabel ?? null,
      checkpointPending: options?.checkpointPending ?? false,
      steps: dedupeItems(
        [
          options?.nextStepNote,
          options?.checkpointPending ? 'Complete the current checkpoint before moving to the next module.' : null,
          currentModule ? `Review the purpose of "${currentModule.title}" before moving on.` : null,
          currentLesson ? `Complete or revisit "${currentLesson.title}" and note the main takeaway.` : null,
          nextLesson ? `When ready, continue into "${nextLesson.title}" to build the next skill.` : null,
          'End the session with a short recap in your own words and one quick self-check.',
        ],
        5,
      ),
      checkForUnderstanding: dedupeItems(
        [
          options?.progressNote,
          options?.checkpointPending ? 'Can you pass the current checkpoint without looking back at the notes?' : null,
          currentModule ? `Can you explain what "${currentModule.title}" is meant to teach?` : null,
          nextModule ? `Do you know what skill comes next in "${nextModule.title}"?` : null,
        ],
        3,
      ),
    };
  }

  if (mode === 'check_my_answer') {
    return {
      type: 'check_my_answer',
      progressNote: options?.progressNote ?? null,
      currentModuleLabel: options?.currentModuleLabel ?? null,
      nextStepLabel: options?.nextStepLabel ?? null,
      checkpointPending: options?.checkpointPending ?? false,
      verdict: firstNonEmpty(
        options?.nextStepNote,
        focus ? `Your answer should stay close to this focus: ${focus}` : null,
        `Keep your answer tied to the current step in ${course.title}.`,
      ),
      confidenceLabel: 'Medium confidence',
      confidenceScore: 56,
      correct: dedupeItems(
        [
          currentModule ? `A strong answer should clearly name the goal of "${currentModule.title}".` : null,
          currentLesson ? `It should connect back to "${currentLesson.title}".` : null,
        ],
        2,
      ),
      missing: dedupeItems(
        [
          options?.checkpointPending
            ? `Before moving on, your answer should show you are ready for the checkpoint "${options?.checkpointLessonTitle ?? 'coming next'}".`
            : null,
          nextModule ? `A stronger answer could prepare you for what comes next in "${nextModule.title}".` : null,
        ],
        2,
      ),
      improve: dedupeItems(
        [
          currentLesson
            ? `Rewrite your answer using the vocabulary and idea from "${currentLesson.title}".`
            : 'Rewrite your answer using the key idea from the current module.',
          options?.checkpointPending
            ? 'Add one sentence that proves you can pass the checkpoint before moving on.'
            : 'Add one sentence that links your answer to the next lesson.',
        ],
        2,
      ),
    };
  }

  return null;
}

function fallbackReplyFromStructured(structured: AiStructuredResponse | null) {
  if (!structured) return null;
  if (structured.type === 'quiz') return quizTextFromStructured(structured);
  if (structured.type === 'study_plan') return studyPlanTextFromStructured(structured);
  if (structured.type === 'explain_wrong_answer') {
    return [
      structured.verdict ? `Verdict: ${structured.verdict}` : '',
      structured.whyWrong.length > 0
        ? `Why this answer misses:\n${structured.whyWrong.map((item) => `- ${item}`).join('\n')}`
        : '',
      structured.correctAnswer ? `Correct answer: ${structured.correctAnswer}` : '',
      structured.memoryTips.length > 0
        ? `Memory tip:\n${structured.memoryTips.map((item) => `- ${item}`).join('\n')}`
        : '',
      structured.nextTry.length > 0
        ? `What to try next:\n${structured.nextTry.map((item) => `- ${item}`).join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');
  }
  return null;
}

function orderedAnswerLabel(optionIds: string[], options: Array<{ id: string; text: string }>) {
  return optionIds
    .map((optionId) => options.find((option) => option.id === optionId)?.text ?? null)
    .filter(Boolean)
    .join(' -> ');
}

function orderedMismatchNotes(
  selectedOptionIds: string[],
  correctOptionIds: string[],
  options: Array<{ id: string; text: string }>,
) {
  const selectedLabels = selectedOptionIds
    .map((optionId) => options.find((option) => option.id === optionId)?.text ?? null)
    .filter(Boolean) as string[];
  const correctLabels = correctOptionIds
    .map((optionId) => options.find((option) => option.id === optionId)?.text ?? null)
    .filter(Boolean) as string[];

  const firstMismatchIndex = correctOptionIds.findIndex((correctOptionId, index) => selectedOptionIds[index] !== correctOptionId);
  if (firstMismatchIndex === -1) {
    return {
      firstMismatch: null,
      selectedOrderLabel: selectedLabels.join(' -> '),
      correctOrderLabel: correctLabels.join(' -> '),
    };
  }

  return {
    firstMismatch: {
      position: firstMismatchIndex + 1,
      expected: correctLabels[firstMismatchIndex] ?? null,
      received: selectedLabels[firstMismatchIndex] ?? null,
    },
    selectedOrderLabel: selectedLabels.join(' -> '),
    correctOrderLabel: correctLabels.join(' -> '),
  };
}

function fallbackStructuredForExplainWrongAnswer(input: {
  questionType: QuestionType;
  questionPrompt: string;
  selectedAnswerLabel: string | null;
  correctAnswerLabel: string | null;
  officialExplanation: string | null;
  learningContext: AiLearningContext;
  orderedFirstMismatch?: {
    position: number;
    expected: string | null;
    received: string | null;
  } | null;
}) {
  const questionSpecificWhyWrong =
    input.questionType === QuestionType.short_answer
      ? dedupeItems(
          [
            input.selectedAnswerLabel
              ? `Your wording was "${input.selectedAnswerLabel}", but this question expected the exact idea or phrase "${input.correctAnswerLabel ?? 'shown in the lesson'}".`
              : 'This short-answer question expected a specific keyword or phrase from the lesson.',
            input.officialExplanation ?? `The question is checking whether you understood: ${input.questionPrompt}`,
          ],
          2,
        )
      : input.questionType === QuestionType.ordered
        ? dedupeItems(
            [
              input.orderedFirstMismatch
                ? `The first sequence mistake is at step ${input.orderedFirstMismatch.position}: it should be "${input.orderedFirstMismatch.expected ?? 'the expected step'}", not "${input.orderedFirstMismatch.received ?? 'this step'}".`
                : input.selectedAnswerLabel
                  ? `Your sequence was "${input.selectedAnswerLabel}", but the lesson expects a different order.`
                  : 'This ordered question depends on putting the steps in the exact lesson sequence.',
              input.officialExplanation ?? `The question is checking whether you understood: ${input.questionPrompt}`,
            ],
            2,
          )
        : dedupeItems(
            [
              input.selectedAnswerLabel
                ? `You chose "${input.selectedAnswerLabel}", but the lesson supports "${input.correctAnswerLabel ?? 'another option'}" instead.`
                : 'Your answer did not match the supported option for this question.',
              input.officialExplanation ?? `The question is checking whether you understood: ${input.questionPrompt}`,
            ],
            2,
          );

  const questionSpecificMemoryTips =
    input.questionType === QuestionType.short_answer
      ? dedupeItems(
          [
            input.correctAnswerLabel ? `Memorize the target phrase exactly as: ${input.correctAnswerLabel}` : null,
            input.learningContext.currentModuleLabel
              ? `Before answering, restate the key definition from ${input.learningContext.currentModuleLabel} in one short sentence.`
              : null,
          ],
          2,
        )
      : input.questionType === QuestionType.ordered
        ? dedupeItems(
            [
              input.correctAnswerLabel ? `Say the process out loud in order: ${input.correctAnswerLabel}` : null,
              'Look for the very first action in the process before deciding the rest of the order.',
            ],
            2,
          )
        : dedupeItems(
            [
              input.correctAnswerLabel ? `Tie your reasoning back to why "${input.correctAnswerLabel}" fits the lesson rule.` : null,
              'Ask yourself which option matches the lesson definition most directly.',
            ],
            2,
          );

  const questionSpecificNextTry =
    input.questionType === QuestionType.short_answer
      ? dedupeItems(
          [
            input.correctAnswerLabel ? `Try again using the exact phrase "${input.correctAnswerLabel}".` : null,
            'Keep your answer short and centered on the core term from the lesson.',
          ],
          2,
        )
      : input.questionType === QuestionType.ordered
        ? dedupeItems(
            [
              input.orderedFirstMismatch
                ? `Start again from step ${input.orderedFirstMismatch.position} and rebuild the sequence from there.`
                : 'Try rebuilding the sequence from the first action to the last action.',
              input.correctAnswerLabel ? `Use this target order: ${input.correctAnswerLabel}` : null,
            ],
            2,
          )
        : dedupeItems(
            [
              'Eliminate the option that does not match the lesson rule before making your final pick.',
              input.correctAnswerLabel ? `Try again with "${input.correctAnswerLabel}" in mind.` : null,
            ],
            2,
          );

  return {
    type: 'explain_wrong_answer' as const,
    progressNote: input.learningContext.progressNote,
    currentModuleLabel: input.learningContext.currentModuleLabel,
    nextStepLabel: input.learningContext.nextStepLabel,
    checkpointPending: input.learningContext.checkpointPending,
    verdict: 'This answer missed the target.',
    whyWrong: questionSpecificWhyWrong,
    correctAnswer: input.correctAnswerLabel ?? 'Review the lesson explanation and the correct option before trying again.',
    memoryTips: dedupeItems(
      [
        ...questionSpecificMemoryTips,
        input.learningContext.currentModuleLabel
          ? `Anchor your thinking in ${input.learningContext.currentModuleLabel} before answering.`
          : null,
        input.learningContext.nextStepLabel
          ? `Use the next step as a clue: ${input.learningContext.nextStepLabel}`
          : 'Restate the core lesson idea in your own words before answering.',
      ],
      3,
    ),
    nextTry: dedupeItems(
      [
        ...questionSpecificNextTry,
        input.learningContext.checkpointPending
          ? 'Revisit this concept before attempting the checkpoint.'
          : 'Try the question again after reviewing the key idea once more.',
        input.correctAnswerLabel ? `Use this as your target answer: ${input.correctAnswerLabel}` : null,
      ],
      3,
    ),
  };
}

function fallbackTextForLesson(
  lesson: {
    title: string;
    learningObjective: string | null;
    blocks: Array<{ type: string; content: any }>;
  },
  mode: AiMode,
  userMessage?: string,
  userMeta?: { name?: string; email?: string; xp?: number },
) {
  const msgLower = (userMessage ?? '').toLowerCase();
  const isArabic = /[\u0600-\u06FF]/.test(msgLower);
  const name = userMeta?.name ?? 'Learner';
  const email = userMeta?.email ? ` (${userMeta.email})` : '';
  const xp = userMeta?.xp ?? 0;

  if (
    msgLower.includes('know me') ||
    msgLower.includes('who am i') ||
    msgLower.includes('من انا') ||
    msgLower.includes('مين انا') ||
    msgLower.includes('تعرفني')
  ) {
    return isArabic
      ? `نعم، طبعاً أعرفك! أنت الطالب **${name}**${email}. 🎓✨\nأنت تدرس حالياً درس **"${lesson.title}"** وحصلت على **${xp} XP** في منصة SkillForge! 🚀\nكيف يمكنني مساعدتك في دراستك اليوم؟`
      : `Yes, of course I know you! You are **${name}**${email}. 🎓✨\nYou are currently studying **"${lesson.title}"** and have earned **${xp} XP** on SkillForge! 🚀\nHow can I assist you with your learning goals today?`;
  }

  if (
    msgLower.includes('who are you') ||
    msgLower.includes('hello') ||
    msgLower.includes('hi') ||
    msgLower.includes('من انت') ||
    msgLower.includes('مين انت') ||
    msgLower.includes('مرحبا') ||
    msgLower.includes('ازيك')
  ) {
    return isArabic
      ? `أهلاً بك يا **${name}**! أنا الذكاء الاصطناعي **Forge AI**، المعلم الذكي الخاص بك في منصة SkillForge! 🤖✨\nأنا هنا لمساعدتك في فهم وشرح درس **"${lesson.title}"** والإجابة على أي سؤال.`
      : `Hello **${name}**! I am **Forge AI**, your dedicated AI tutor on SkillForge! 🤖✨\nI am here to help you learn, practice, and master **"${lesson.title}"**. How can I assist you today?`;
  }

  const keyIdeas = keyIdeasFromBlocks(lesson.blocks, 3);
  const objective = firstNonEmpty(lesson.learningObjective, keyIdeas[0], lesson.title);

  if (userMessage && userMessage.trim().length > 0) {
    const cleanQ = userMessage.trim();
    if (isArabic) {
      return [
        `**إجابةForge AI على سؤالك:** "${cleanQ}"`,
        objective ? `📌 **المفهوم الرئيسي لدرس (${lesson.title}):** ${objective}` : null,
        keyIdeas[0] ? `💡 **التركيز الأساسي:** ${keyIdeas[0]}` : null,
        keyIdeas[1] ? `🔍 **تفاصيل إضافية:** ${keyIdeas[1]}` : null,
        `إذا كان لديك أي سؤال إضافي حول هذا الموضوع، يسعدني الإجابة عليه فوراً!`,
      ]
        .filter(Boolean)
        .join('\n\n');
    } else {
      return [
        `**Forge AI Answer to your question:** "${cleanQ}"`,
        objective ? `📌 **Core Concept of (${lesson.title}):** ${objective}` : null,
        keyIdeas[0] ? `💡 **Key Takeaway:** ${keyIdeas[0]}` : null,
        keyIdeas[1] ? `🔍 **Practical Detail:** ${keyIdeas[1]}` : null,
        `Feel free to ask any follow-up question!`,
      ]
        .filter(Boolean)
        .join('\n\n');
    }
  }

  if (mode === 'simplify') {
    return [
      `In simple words, "${lesson.title}" is about this:`,
      objective ?? 'This lesson gives you one practical idea you can apply right away.',
      keyIdeas[0] ? `The most important part to remember is: ${keyIdeas[0]}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  if (mode === 'give_example') {
    return [
      `A simple example for "${lesson.title}":`,
      keyIdeas[0]
        ? `Imagine you are working with this idea in practice: ${keyIdeas[0]}`
        : 'Imagine a small real task where you apply the lesson idea step by step.',
      keyIdeas[1] ? `Then check whether it still makes sense when you add: ${keyIdeas[1]}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  if (mode === 'summarize') {
    return [
      `Quick recap of "${lesson.title}":`,
      ...dedupeItems(
        [objective, ...keyIdeas, 'You are ready to move on once you can explain the main idea without the notes.'],
        4,
      ).map((item) => `- ${item}`),
    ].join('\n');
  }

  if (mode === 'hint') {
    return firstNonEmpty(
      keyIdeas[0] ? `Start by focusing on this key point: ${keyIdeas[0]}` : null,
      objective ? `A useful hint is to bring your answer back to this objective: ${objective}` : null,
      `Start with the main goal of "${lesson.title}" before worrying about details.`,
    );
  }

  return null;
}

function fallbackTextForCourse(
  course: {
    title: string;
    modules: Array<{
      title: string;
      description: string | null;
      lessons: Array<{
        title: string;
        learningObjective: string | null;
        blocks: Array<{ type: string; content: any }>;
      }>;
    }>;
  },
  mode: AiMode,
  options?: AiProgressContextOptions & { nextStepNote?: string | null },
) {
  const firstModule = course.modules[0] ?? null;
  const currentModule =
    course.modules.find((module) => safeText(module.title) === safeText(options?.currentModuleTitle)) ?? firstModule ?? null;
  const currentModuleIndex = currentModule ? course.modules.findIndex((module) => module.title === currentModule.title) : -1;
  const nextModule = currentModuleIndex >= 0 ? course.modules[currentModuleIndex + 1] ?? null : course.modules[1] ?? null;
  const currentLesson =
    currentModule?.lessons.find((lesson) => safeText(lesson.title) === safeText(options?.nextLessonTitle ?? options?.checkpointLessonTitle)) ??
    currentModule?.lessons[0] ??
    null;
  const focus = firstNonEmpty(
    options?.nextStepNote,
    currentLesson?.learningObjective,
    currentModule?.description,
    `Build steady progress in ${course.title}`,
  );

  if (mode === 'explain') {
    return [
      `Here is what matters most in ${course.title} right now:`,
      options?.currentModuleLabel ? `1. Current focus: ${options.currentModuleLabel}` : null,
      focus ? `2. Main idea: ${focus}` : null,
      options?.nextStepLabel ? `3. Immediate next step: ${options.nextStepLabel}` : null,
      options?.checkpointPending
        ? '4. Clear the checkpoint before moving to the next module.'
        : nextModule
          ? `4. After that, you will be ready for ${nextModule.title}.`
          : '4. After that, recap the course in your own words.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (mode === 'simplify') {
    return [
      `In plain language, your current job in ${course.title} is this:`,
      focus ?? 'Stay with the current module and make sure the core idea is clear.',
      options?.nextStepLabel ? `The next move is: ${options.nextStepLabel}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  if (mode === 'give_example') {
    return [
      `A practical way to think about your current step in ${course.title}:`,
      currentLesson?.learningObjective
        ? `Use "${currentLesson.title}" as your working example: ${currentLesson.learningObjective}`
        : focus,
      nextModule ? `Once that feels easy, the next level is ${nextModule.title}.` : null,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  if (mode === 'summarize') {
    return [
      `Quick recap for ${course.title}:`,
      ...dedupeItems(
        [
          options?.progressNote,
          options?.currentModuleLabel,
          focus,
          options?.nextStepLabel,
          options?.checkpointPending ? 'A checkpoint stands between this module and the next one.' : null,
        ],
        5,
      ).map((item) => `- ${item}`),
    ].join('\n');
  }

  if (mode === 'hint') {
    return firstNonEmpty(
      options?.nextStepNote,
      options?.nextStepLabel ? `Keep your attention on this next move: ${options.nextStepLabel}` : null,
      focus ? `A good hint is to anchor yourself in this idea: ${focus}` : null,
      `Stay with the current module in ${course.title} before jumping ahead.`,
    );
  }

  return null;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private limiter: AiRateLimiter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly provider: OpenAiCompatibleProvider,
    private readonly events: EventsService,
    private readonly access: LearningAccessService,
  ) {
    const rateLimitLimit = Number(this.config.get('AI_RATE_LIMIT_LIMIT') ?? 10);
    const rateLimitWindowSeconds = Number(this.config.get('AI_RATE_LIMIT_WINDOW_SECONDS') ?? 60);
    const redisUrl = this.config.get<string>('REDIS_URL') ?? null;

    this.limiter = redisUrl
      ? new RedisBackedRateLimiter({
          url: redisUrl,
          capacity: rateLimitLimit,
          windowSeconds: rateLimitWindowSeconds,
          fallback: new SimpleRateLimiter(
            rateLimitLimit,
            rateLimitWindowSeconds > 0 ? rateLimitLimit / rateLimitWindowSeconds : rateLimitLimit,
          ),
        })
      : new SimpleRateLimiter(
          rateLimitLimit,
          rateLimitWindowSeconds > 0 ? rateLimitLimit / rateLimitWindowSeconds : rateLimitLimit,
        );
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

  private async getCourseAccessibleByIdOrSlug(input: { courseId?: string; courseSlug?: string }) {
    const where = input.courseId ? { id: input.courseId } : input.courseSlug ? { slug: input.courseSlug } : null;
    if (!where) throw new BadRequestException('courseId or courseSlug is required');

    const course = await this.prisma.course.findUnique({
      where: where as any,
      include: {
        skills: { include: { skill: true } },
        modules: {
          where: { deletedAt: null, status: ContentStatus.published },
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              where: { deletedAt: null, status: ContentStatus.published },
              orderBy: { order: 'asc' },
              include: {
                blocks: { orderBy: { order: 'asc' } },
                quiz: {
                  select: {
                    id: true,
                    status: true,
                    deletedAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course || course.deletedAt || course.status !== ContentStatus.published) {
      throw new NotFoundException('Course not found');
    }

    return course;
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
    const messages = await this.prisma.aiMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
    });
    return messages.reverse();
  }

  private async getOrCreateCourseSession(userId: string, courseId: string, sessionId?: string) {
    if (sessionId) {
      const session = await this.prisma.courseAiSession.findUnique({ where: { id: sessionId } });
      if (!session || session.userId !== userId || session.courseId !== courseId) {
        throw new ForbiddenException('Invalid session');
      }
      return session;
    }

    return this.prisma.courseAiSession.create({
      data: { userId, courseId, title: 'Course chat' } as any,
    });
  }

  private async recentMessagesForCourseSession(sessionId: string) {
    const messages = await this.prisma.courseAiMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
    });
    return messages.reverse();
  }

  private async learnerProgressSummaryForCourse(
    userId: string,
    course: {
      title: string;
      modules: Array<{
        id: string;
        title: string;
        order: number;
        lessons: Array<{
          id: string;
          title: string;
          slug: string;
          order: number;
          quiz?: {
            id: string;
            status: ContentStatus;
            deletedAt?: Date | null;
          } | null;
        }>;
      }>;
    },
  ) {
    const lessonIds = course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id));
    if (lessonIds.length === 0) {
      return {
        progressNote: null,
        nextStepNote: null,
        currentModuleLabel: null,
        nextStepLabel: null,
        checkpointPending: false,
        currentModuleTitle: null,
        nextLessonTitle: null,
        checkpointLessonTitle: null,
      };
    }

    const [completedRows, passedRows] = await Promise.all([
      this.prisma.lessonProgress.findMany({
        where: {
          userId,
          lessonId: { in: lessonIds },
          completedAt: { not: null },
        },
        select: { lessonId: true },
      }),
      this.prisma.quizAttempt.findMany({
        where: {
          userId,
          lessonId: { in: lessonIds },
          passed: true,
        },
        select: { lessonId: true },
      }),
    ]);

    const completedLessonIds = new Set(completedRows.map((row) => row.lessonId));
    const passedCheckpointLessonIds = new Set(passedRows.map((row) => row.lessonId));
    const moduleSnapshots = course.modules.map((module) => ({
      module,
      progress: deriveModuleProgressState(module, completedLessonIds, passedCheckpointLessonIds),
    }));

    const totalLessons = lessonIds.length;
    const completedLessons = completedLessonIds.size;
    const completedModules = moduleSnapshots.filter((entry) => entry.progress.completed).length;
    const totalModules = moduleSnapshots.length;
    const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const activeModule = moduleSnapshots.find((entry) => !entry.progress.completed) ?? moduleSnapshots[0] ?? null;
    const checkpointLesson =
      activeModule &&
      activeModule.progress.checkpointRequired &&
      activeModule.progress.completedLessons === activeModule.progress.totalLessons &&
      !activeModule.progress.checkpointPassed
        ? activeModule.module.lessons.find((lesson) => lesson.id === activeModule.progress.checkpointLessonId) ?? null
        : null;
    const nextLesson =
      checkpointLesson ?? activeModule?.module.lessons.find((lesson) => !completedLessonIds.has(lesson.id)) ?? null;
    const currentModuleLabel = activeModule
      ? `Module ${activeModule.module.order + 1}: ${activeModule.module.title}`
      : null;
    const nextStepLabel = checkpointLesson
      ? `Checkpoint: ${checkpointLesson.title}`
      : nextLesson
        ? `Next lesson: ${nextLesson.title}`
        : activeModule
          ? `Keep working through ${activeModule.module.title}`
          : null;
    const checkpointPending = Boolean(checkpointLesson);

    const progressNote = `Current progress: ${percent}% complete (${completedLessons}/${totalLessons} lessons, ${completedModules}/${totalModules} modules).`;
    const nextStepNote = checkpointLesson
      ? `Next best step: pass the checkpoint "${checkpointLesson.title}" in "${activeModule?.module.title}" before moving to the next module.`
      : activeModule && nextLesson
        ? `Next best step: continue with "${nextLesson.title}" in module "${activeModule.module.title}".`
        : activeModule
          ? `Current focus module: "${activeModule.module.title}".`
          : 'You have finished the current course path. Use the study plan to review key areas.';

    return {
      progressNote,
      nextStepNote,
      currentModuleLabel,
      nextStepLabel,
      checkpointPending,
      currentModuleTitle: activeModule?.module.title ?? null,
      nextLessonTitle: checkpointLesson ? null : nextLesson?.title ?? null,
      checkpointLessonTitle: checkpointLesson?.title ?? null,
    };
  }

  async lessonChat(userId: string, input: { lessonId?: string; lessonSlug?: string; sessionId?: string; message: string; mode: AiMode }) {
    if (!(await this.limiter.tryConsume(userId, 1))) {
      throw new ForbiddenException('Rate limit exceeded');
    }

    const lesson = await this.getLessonAccessibleByIdOrSlug({ lessonId: input.lessonId, lessonSlug: input.lessonSlug });
    await this.access.assertLessonUnlocked(userId, lesson);

    const session = await this.getOrCreateSession(userId, lesson.id, input.sessionId);
    const windowed = await this.recentMessagesForSession(session.id);
    const course = await this.getCourseAccessibleByIdOrSlug({ courseId: lesson.module.course.id });
    const learnerProgress = await this.learnerProgressSummaryForCourse(userId, course);
    const learningContext = buildLessonLearningContext({
      courseTitle: lesson.module.course.title,
      moduleOrder: typeof lesson.module.order === 'number' ? lesson.module.order : null,
      moduleTitle: lesson.module.title,
      lessonTitle: lesson.title,
      progressNote: learnerProgress.progressNote,
      nextStepLabel: learnerProgress.nextStepLabel,
      checkpointPending: learnerProgress.checkpointPending,
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    const userName = profile?.fullName ?? user?.email?.split('@')[0] ?? 'Learner';
    const userLevel = profile?.level ?? 1;

    const maxContextChars = 3500;
    const lessonCtx = lessonContextFromBlocks(
      lesson.blocks.map((b) => ({ type: b.type, content: b.content })),
      maxContextChars,
    );

    const system = systemPromptForMode(input.mode);
    const context = [
      `Course title: ${lesson.module.course.title}`,
      `Module title: ${lesson.module.title}`,
      `Lesson title: ${lesson.title}`,
      lesson.learningObjective ? `Objective: ${lesson.learningObjective}` : '',
      `Student name: ${userName}`,
      `Student level: ${userLevel}`,
      learnerProgress.progressNote ?? '',
      learningContext.currentModuleLabel ? `Current module: ${learningContext.currentModuleLabel}` : '',
      learningContext.nextStepLabel ? `Immediate next step: ${learningContext.nextStepLabel}` : '',
      learningContext.checkpointPending
        ? 'Checkpoint gate: the learner may need to pass a checkpoint before the next module unlocks.'
        : '',
      `Lesson content:\n${lessonCtx}`,
      lesson.aiPromptSeed ? `Teacher notes:\n${lesson.aiPromptSeed}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const messages: ProviderChatMessage[] = [
      { role: 'system', content: system },
      { role: 'system', content: context },
      { role: 'system', content: 'Language rule: Always respond in the same language as the user message. Arabic message -> Arabic reply. English message -> English reply.' },
      ...windowed
        .filter((m) => m.role === AiMessageRole.user || m.role === AiMessageRole.assistant)
        .map<ProviderChatMessage>((m) => ({
          role: (m.role === AiMessageRole.user ? 'user' : 'assistant') as ProviderChatMessage['role'],
          content: m.content,
        })),
      { role: 'user' as const, content: input.message },
    ];

    // Persist user message first
    await this.prisma.aiMessage.create({
      data: { sessionId: session.id, role: AiMessageRole.user, content: input.message },
    });
    await this.events.track(userId, 'ai_message_sent', { entityType: 'Lesson', entityId: lesson.id, sessionId: session.id, mode: input.mode });

    let assistantText = '';
    let providerStatus: AiProviderStatus = 'ok';
    let errorMessage: string | null = null;
    let structured: AiStructuredResponse | null = null;
    try {
      const out = await this.provider.chat({
        messages,
        maxOutputTokens: Number(this.config.get('AI_MAX_OUTPUT_TOKENS') ?? 800),
        temperature: 0.4,
      });
      assistantText = out.text || 'I can help - could you rephrase your question?';
      structured = structuredResponseFromText(assistantText, input.mode);
    } catch (e: any) {
      this.logger.warn(`ai provider failure user=${userId} lesson=${lesson.id} session=${session.id}`);
      const fallbackStructured = fallbackStructuredForLesson(lesson, input.mode);
      if (fallbackStructured) {
        providerStatus = 'fallback';
        structured = fallbackStructured;
        assistantText = fallbackReplyFromStructured(fallbackStructured) ?? '';
        errorMessage = 'Live AI is temporarily unavailable, so this answer was generated from the current lesson content.';
      } else {
        const fallbackText = fallbackTextForLesson(lesson, input.mode, input.message, { name: userName, email: user?.email, xp: profile?.xp ?? 0 });
        if (fallbackText) {
          providerStatus = 'fallback';
          assistantText = fallbackText;
          errorMessage = 'Live AI is temporarily unavailable, so this answer was generated from the current lesson content.';
        } else {
          providerStatus = 'unavailable';
          errorMessage =
            e instanceof Error && e.message
              ? `AI provider error: ${e.message}`
              : 'AI provider is unavailable right now. No assistant reply was generated.';
        }
      }
    }

    if (providerStatus !== 'unavailable' && assistantText) {
      await this.prisma.aiMessage.create({
        data: { sessionId: session.id, role: AiMessageRole.assistant, content: assistantText },
      });
    }

    const fullHistory = await this.prisma.aiMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });
    return {
      sessionId: session.id,
      reply: providerStatus === 'unavailable' ? null : assistantText,
      providerStatus,
      errorMessage,
      messages: mapStoredMessages(fullHistory),
      sources: lessonSourcesFromLesson(lesson),
      learningContext,
      structured,
    };
  }

  async lessonHistory(userId: string, lessonId: string) {
    const lesson = await this.getLessonAccessibleByIdOrSlug({ lessonId });
    await this.access.assertLessonUnlocked(userId, lesson);
    const course = await this.getCourseAccessibleByIdOrSlug({ courseId: lesson.module.course.id });
    const learnerProgress = await this.learnerProgressSummaryForCourse(userId, course);
    const learningContext = buildLessonLearningContext({
      courseTitle: lesson.module.course.title,
      moduleOrder: typeof lesson.module.order === 'number' ? lesson.module.order : null,
      moduleTitle: lesson.module.title,
      lessonTitle: lesson.title,
      progressNote: learnerProgress.progressNote,
      nextStepLabel: learnerProgress.nextStepLabel,
      checkpointPending: learnerProgress.checkpointPending,
    });

    const session = await this.prisma.aiSession.findFirst({
      where: { userId, lessonId },
      orderBy: { updatedAt: 'desc' },
    });
    if (!session) {
      return {
        sessionId: null,
        messages: [] as any[],
        sources: lessonSourcesFromLesson(lesson),
        learningContext,
        structured: null,
      };
    }

    const messages = await this.prisma.aiMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });

    return {
      sessionId: session.id,
      messages: mapStoredMessages(messages),
      sources: lessonSourcesFromLesson(lesson),
      learningContext,
      structured: latestAssistantStructuredResponse(messages),
    };
  }

  async courseChat(
    userId: string,
    input: {
      courseId?: string;
      courseSlug?: string;
      sessionId?: string;
      message: string;
      mode: AiMode;
    },
  ) {
    if (!(await this.limiter.tryConsume(`${userId}:course`, 1))) {
      throw new ForbiddenException('Rate limit exceeded');
    }

    const course = await this.getCourseAccessibleByIdOrSlug({
      courseId: input.courseId,
      courseSlug: input.courseSlug,
    });
    await this.access.assertEnrolled(userId, course.id);

    const session = await this.getOrCreateCourseSession(userId, course.id, input.sessionId);
    const windowed = await this.recentMessagesForCourseSession(session.id);

    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    const userName = profile?.fullName ?? 'Student';
    const userLevel = profile?.level ?? 1;
    const learnerProgress = await this.learnerProgressSummaryForCourse(userId, course);
    const learningContext = buildCourseLearningContext(course.title, learnerProgress);

    const courseCtx = courseContextFromCourse(course, 5200);
    const courseOutline = courseOutlineFromCourse(course, 1600);
    const system = systemPromptForMode(input.mode, 'course');
    const context = [
      `Course title: ${course.title}`,
      course.description ? `Course description: ${course.description}` : '',
      courseOutline ? `Course structure:\n${courseOutline}` : '',
      `Student name: ${userName}`,
      `Student level: ${userLevel}`,
      learnerProgress.progressNote ?? '',
      learnerProgress.currentModuleLabel ? `Current module: ${learnerProgress.currentModuleLabel}` : '',
      learnerProgress.nextStepLabel ? `Immediate next step: ${learnerProgress.nextStepLabel}` : '',
      learnerProgress.checkpointPending
        ? 'Checkpoint gate: the learner must pass the current checkpoint before unlocking the next module.'
        : '',
      learnerProgress.nextStepNote ?? '',
      `Course context:\n${courseCtx}`,
      'You can explain concepts, design a study plan, ask quick quiz questions, and connect ideas across lessons in this course.',
    ]
      .filter(Boolean)
      .join('\n\n');

    const messages: ProviderChatMessage[] = [
      { role: 'system', content: system },
      { role: 'system', content: context },
      ...windowed
        .filter((message) => message.role === AiMessageRole.user || message.role === AiMessageRole.assistant)
        .map<ProviderChatMessage>((message) => ({
          role: (message.role === AiMessageRole.user ? 'user' : 'assistant') as ProviderChatMessage['role'],
          content: message.content,
        })),
      { role: 'user', content: input.message },
    ];

    await this.prisma.courseAiMessage.create({
      data: { sessionId: session.id, role: AiMessageRole.user, content: input.message } as any,
    });
    await this.events.track(userId, 'ai_message_sent', {
      entityType: 'Course',
      entityId: course.id,
      sessionId: session.id,
      mode: input.mode,
    });

    let assistantText = '';
    let providerStatus: AiProviderStatus = 'ok';
    let errorMessage: string | null = null;
    let structured: AiStructuredResponse | null = null;
    try {
      const out = await this.provider.chat({
        messages,
        maxOutputTokens: Number(this.config.get('AI_MAX_OUTPUT_TOKENS') ?? 800),
        temperature: 0.35,
      });
      assistantText = out.text || 'I can help with this course. Try asking for a study plan, summary, or quiz.';
      const shouldAttachProgressContext =
        input.mode === 'study_plan' || input.mode === 'quiz_me' || input.mode === 'check_my_answer';
      structured = structuredResponseFromText(assistantText, input.mode, {
        progressNote: shouldAttachProgressContext ? learnerProgress.progressNote : null,
        currentModuleLabel: shouldAttachProgressContext ? learnerProgress.currentModuleLabel : null,
        nextStepLabel: shouldAttachProgressContext ? learnerProgress.nextStepLabel : null,
        checkpointPending: shouldAttachProgressContext ? learnerProgress.checkpointPending : false,
        currentModuleTitle: shouldAttachProgressContext ? learnerProgress.currentModuleTitle : null,
        nextLessonTitle: shouldAttachProgressContext ? learnerProgress.nextLessonTitle : null,
        checkpointLessonTitle: shouldAttachProgressContext ? learnerProgress.checkpointLessonTitle : null,
      });
    } catch (e: any) {
      this.logger.warn(`ai provider failure user=${userId} course=${course.id} session=${session.id}`);
      const fallbackStructured = fallbackStructuredForCourse(course, input.mode, {
        progressNote: learnerProgress.progressNote,
        currentModuleLabel: learnerProgress.currentModuleLabel,
        nextStepLabel: learnerProgress.nextStepLabel,
        checkpointPending: learnerProgress.checkpointPending,
        currentModuleTitle: learnerProgress.currentModuleTitle,
        nextLessonTitle: learnerProgress.nextLessonTitle,
        checkpointLessonTitle: learnerProgress.checkpointLessonTitle,
        nextStepNote: learnerProgress.nextStepNote,
      });
      if (fallbackStructured) {
        providerStatus = 'fallback';
        structured = fallbackStructured;
        assistantText = fallbackReplyFromStructured(fallbackStructured) ?? '';
        errorMessage = 'Live AI is temporarily unavailable, so this answer was generated from the current course content.';
      } else {
        const fallbackText = fallbackTextForCourse(course, input.mode, {
          progressNote: learnerProgress.progressNote,
          currentModuleLabel: learnerProgress.currentModuleLabel,
          nextStepLabel: learnerProgress.nextStepLabel,
          checkpointPending: learnerProgress.checkpointPending,
          currentModuleTitle: learnerProgress.currentModuleTitle,
          nextLessonTitle: learnerProgress.nextLessonTitle,
          checkpointLessonTitle: learnerProgress.checkpointLessonTitle,
          nextStepNote: learnerProgress.nextStepNote,
        });
        if (fallbackText) {
          providerStatus = 'fallback';
          assistantText = fallbackText;
          errorMessage = 'Live AI is temporarily unavailable, so this answer was generated from the current course content.';
        } else {
          providerStatus = 'unavailable';
          errorMessage =
            e instanceof Error && e.message
              ? `AI provider error: ${e.message}`
              : 'AI provider is unavailable right now. No assistant reply was generated.';
        }
      }
    }

    if (providerStatus !== 'unavailable' && assistantText) {
      await this.prisma.courseAiMessage.create({
        data: { sessionId: session.id, role: AiMessageRole.assistant, content: assistantText } as any,
      });
    }

    const fullHistory = await this.prisma.courseAiMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });

    return {
      sessionId: session.id,
      reply: providerStatus === 'unavailable' ? null : assistantText,
      providerStatus,
      errorMessage,
      messages: mapStoredMessages(fullHistory),
      sources: courseSourcesFromCourse(course),
      learningContext,
      structured,
    };
  }

  async courseHistory(userId: string, courseId: string) {
    const course = await this.getCourseAccessibleByIdOrSlug({ courseId });
    await this.access.assertEnrolled(userId, course.id);
    const learnerProgress = await this.learnerProgressSummaryForCourse(userId, course);
    const learningContext = buildCourseLearningContext(course.title, learnerProgress);

    const session = await this.prisma.courseAiSession.findFirst({
      where: { userId, courseId: course.id },
      orderBy: { updatedAt: 'desc' },
    });
    if (!session) {
      return {
        sessionId: null,
        messages: [] as any[],
        sources: courseSourcesFromCourse(course),
        learningContext,
        structured: null,
      };
    }

    const messages = await this.prisma.courseAiMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });

    return {
      sessionId: session.id,
      messages: mapStoredMessages(messages),
      sources: courseSourcesFromCourse(course),
      learningContext,
      structured: (() => {
        const latestAssistant = [...messages].reverse().find((message) => message.role === AiMessageRole.assistant);
        if (!latestAssistant) return null;

        const normalizedAssistant = latestAssistant.content.toLowerCase();
        const inferredMode = normalizedAssistant.includes('study plan')
          ? 'study_plan'
          : normalizedAssistant.includes('quiz:') || normalizedAssistant.includes('how to answer:')
            ? 'quiz_me'
            : normalizedAssistant.includes('what is correct') || normalizedAssistant.includes('how to improve')
              ? 'check_my_answer'
              : undefined;

        const shouldAttachProgressContext =
          inferredMode === 'study_plan' || inferredMode === 'quiz_me' || inferredMode === 'check_my_answer';
        return structuredResponseFromText(latestAssistant.content, inferredMode, {
          progressNote: shouldAttachProgressContext ? learnerProgress.progressNote : null,
          currentModuleLabel: shouldAttachProgressContext ? learnerProgress.currentModuleLabel : null,
          nextStepLabel: shouldAttachProgressContext ? learnerProgress.nextStepLabel : null,
          checkpointPending: shouldAttachProgressContext ? learnerProgress.checkpointPending : false,
          currentModuleTitle: shouldAttachProgressContext ? learnerProgress.currentModuleTitle : null,
          nextLessonTitle: shouldAttachProgressContext ? learnerProgress.nextLessonTitle : null,
          checkpointLessonTitle: shouldAttachProgressContext ? learnerProgress.checkpointLessonTitle : null,
        });
      })(),
    };
  }

  async explainWrongAnswer(
    userId: string,
    input: {
      lessonId: string;
      questionId: string;
      selectedOptionId?: string;
      userAnswerText?: string;
      orderedAnswer?: string[];
    },
  ) {
    if (!(await this.limiter.tryConsume(`${userId}:explain`, 1))) {
      throw new ForbiddenException('Rate limit exceeded');
    }

    const lesson = await this.getLessonAccessibleByIdOrSlug({ lessonId: input.lessonId });
    await this.access.assertLessonUnlocked(userId, lesson);
    const course = await this.getCourseAccessibleByIdOrSlug({ courseId: lesson.module.course.id });
    const learnerProgress = await this.learnerProgressSummaryForCourse(userId, course);
    const learningContext = buildLessonLearningContext({
      courseTitle: lesson.module.course.title,
      moduleOrder: typeof lesson.module.order === 'number' ? lesson.module.order : null,
      moduleTitle: lesson.module.title,
      lessonTitle: lesson.title,
      progressNote: learnerProgress.progressNote,
      nextStepLabel: learnerProgress.nextStepLabel,
      checkpointPending: learnerProgress.checkpointPending,
    });

    const question = await this.prisma.question.findUnique({
      where: { id: input.questionId },
      include: { options: { orderBy: { order: 'asc' } }, quiz: true },
    });
    if (!question || question.deletedAt) throw new NotFoundException('Question not found');
    if (!question.quiz || question.quiz.lessonId !== lesson.id) throw new BadRequestException('Question not in lesson');

    let selectedAnswerLabel: string | null = null;
    let correctAnswerLabel: string | null = null;
    let orderedNotes:
      | {
          firstMismatch: {
            position: number;
            expected: string | null;
            received: string | null;
          } | null;
          selectedOrderLabel: string;
          correctOrderLabel: string;
        }
      | null = null;

    if (question.type === QuestionType.multiple_choice || question.type === QuestionType.true_false) {
      const selected = input.selectedOptionId
        ? question.options.find((option) => option.id === input.selectedOptionId) ?? null
        : null;
      const correct = question.correctOptionId
        ? question.options.find((option) => option.id === question.correctOptionId) ?? null
        : null;

      selectedAnswerLabel = selected?.text ?? null;
      correctAnswerLabel = correct?.text ?? null;
    } else if (question.type === QuestionType.short_answer) {
      selectedAnswerLabel = firstNonEmpty(input.userAnswerText);
      correctAnswerLabel = firstNonEmpty(question.correctText);
    } else if (question.type === QuestionType.ordered) {
      orderedNotes = orderedMismatchNotes(
        Array.isArray(input.orderedAnswer) ? input.orderedAnswer : [],
        Array.isArray(question.correctOrder) ? question.correctOrder : [],
        question.options,
      );
      selectedAnswerLabel = orderedNotes.selectedOrderLabel || null;
      correctAnswerLabel = orderedNotes.correctOrderLabel || null;
    } else {
      throw new BadRequestException(`Unsupported question type: ${question.type}`);
    }

    const system = systemPromptForMode('explain_wrong_answer');
    const lessonCtx = lessonContextFromBlocks(
      lesson.blocks.map((block) => ({ type: block.type, content: block.content })),
      2200,
    );
    const availableOptions =
      question.options.length > 0
        ? question.options.map((option, index) => `${index + 1}. ${option.text}`).join(' | ')
        : null;
    const context = [
      `Course title: ${lesson.module.course.title}`,
      `Module title: ${lesson.module.title}`,
      `Lesson title: ${lesson.title}`,
      question.prompt ? `Question: ${question.prompt}` : '',
      `Question type: ${question.type}`,
      learningContext.progressNote ? `Progress: ${learningContext.progressNote}` : '',
      learningContext.currentModuleLabel ? `Current module: ${learningContext.currentModuleLabel}` : '',
      learningContext.nextStepLabel ? `Immediate next step: ${learningContext.nextStepLabel}` : '',
      learningContext.checkpointPending
        ? 'Checkpoint gate: this learner may need to clear a checkpoint before the next module unlocks.'
        : '',
      availableOptions ? `Available options: ${availableOptions}` : '',
      question.type === QuestionType.short_answer && question.correctText
        ? `Expected keyword or phrase: ${question.correctText}`
        : '',
      question.type === QuestionType.ordered && correctAnswerLabel ? `Expected order: ${correctAnswerLabel}` : '',
      question.type === QuestionType.ordered && selectedAnswerLabel ? `User order: ${selectedAnswerLabel}` : '',
      question.type === QuestionType.ordered && orderedNotes?.firstMismatch
        ? `First sequence mismatch: step ${orderedNotes.firstMismatch.position} should be "${orderedNotes.firstMismatch.expected ?? 'the expected step'}", not "${orderedNotes.firstMismatch.received ?? 'this step'}".`
        : '',
      selectedAnswerLabel ? `User answered: ${selectedAnswerLabel}` : 'User answered: (missing)',
      correctAnswerLabel ? `Correct answer: ${correctAnswerLabel}` : 'Correct answer: (unknown)',
      question.explanation ? `Official explanation: ${question.explanation}` : '',
      lessonCtx ? `Lesson content:\n${lessonCtx}` : '',
      lesson.aiPromptSeed ? `Teacher notes:\n${lesson.aiPromptSeed}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    let explanation = '';
    let providerStatus: AiProviderStatus = 'ok';
    let errorMessage: string | null = null;
    let structured: AiStructuredResponse | null = null;

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
      const assistantText =
        out.text || 'Review the lesson objective, compare your answer with the correct one, and try again.';
      structured = structuredResponseFromText(assistantText, 'explain_wrong_answer', {
        progressNote: learnerProgress.progressNote,
        currentModuleLabel: learnerProgress.currentModuleLabel,
        nextStepLabel: learnerProgress.nextStepLabel,
        checkpointPending: learnerProgress.checkpointPending,
        currentModuleTitle: learnerProgress.currentModuleTitle,
        nextLessonTitle: learnerProgress.nextLessonTitle,
        checkpointLessonTitle: learnerProgress.checkpointLessonTitle,
      });
      explanation = fallbackReplyFromStructured(structured) ?? assistantText;
    } catch (error: any) {
      this.logger.warn(`ai provider failure user=${userId} lesson=${lesson.id} explainAnswer`);
      providerStatus = 'fallback';
      structured = fallbackStructuredForExplainWrongAnswer({
        questionType: question.type,
        questionPrompt: question.prompt,
        selectedAnswerLabel,
        correctAnswerLabel,
        officialExplanation: question.explanation,
        learningContext,
        orderedFirstMismatch: orderedNotes?.firstMismatch ?? null,
      });
      explanation =
        fallbackReplyFromStructured(structured) ??
        'Review the lesson objective, compare your answer with the correct one, and try again.';
      errorMessage = 'Live AI is temporarily unavailable, so this explanation was generated from the current lesson content.';

      if (!explanation) {
        providerStatus = 'unavailable';
        errorMessage =
          error instanceof Error && error.message
            ? `AI provider error: ${error.message}`
            : 'AI provider is unavailable right now. No assistant reply was generated.';
      }
    }

    return {
      explanation: providerStatus === 'unavailable' ? '' : explanation,
      providerStatus,
      errorMessage,
      learningContext,
      structured,
    };
  }

  async generateLessonOutline(userId: string, input: {
    topic: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    durationMinutes: number;
  }) {
    const prompt = `You are an expert curriculum designer. Create a structured lesson outline for an online course.
  
  Topic: ${input.topic}
  Level: ${input.level}
  Duration: ${input.durationMinutes} minutes
  
  Return a JSON object with:
  {
    "title": "lesson title",
    "learningObjective": "what students will learn",
    "sections": [
      { "heading": "section title", "description": "section content description", "timeMinutes": 5 }
    ],
    "keyPoints": ["key point 1", "key point 2"],
    "practiceExercise": "a practical exercise description"
  }
  
  Return ONLY valid JSON, no other text.`;
  
    try {
      const out = await this.provider.chat({
        messages: [{ role: 'user', content: prompt }],
        maxOutputTokens: 1000,
        temperature: 0.6,
      });
      // Extract JSON from response
      const jsonMatch = out.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return { outline: JSON.parse(jsonMatch[0]) };
      }
      return { outline: null, raw: out.text };
    } catch (e: any) {
      // Fallback
      return {
        outline: {
          title: `Introduction to ${input.topic}`,
          learningObjective: `Understand the fundamentals of ${input.topic} at ${input.level} level`,
          sections: [
            { heading: 'Overview', description: `What is ${input.topic} and why it matters`, timeMinutes: Math.floor(input.durationMinutes * 0.2) },
            { heading: 'Core Concepts', description: 'Key principles and terminology', timeMinutes: Math.floor(input.durationMinutes * 0.4) },
            { heading: 'Practical Application', description: 'Hands-on examples and exercises', timeMinutes: Math.floor(input.durationMinutes * 0.3) },
            { heading: 'Summary & Review', description: 'Recap and next steps', timeMinutes: Math.floor(input.durationMinutes * 0.1) },
          ],
          keyPoints: [
            `Core definition of ${input.topic}`,
            'Step-by-step process',
            'Common mistakes to avoid',
          ],
          practiceExercise: `Apply what you learned about ${input.topic} in a real scenario`,
        }
      };
    }
  }
  
  async generateQuizQuestions(userId: string, input: {
    lessonContent: string;
    questionCount: number;
  }) {
    const count = Math.min(Math.max(input.questionCount, 1), 10);
    const prompt = `You are an expert educator. Based on the following lesson content, generate ${count} quiz questions.
  
  Lesson content:
  ${input.lessonContent.slice(0, 3000)}
  
  Return a JSON array of questions:
  [
    {
      "question": "question text",
      "type": "multiple_choice",
      "options": ["option A", "option B", "option C", "option D"],
      "correctAnswer": "option A",
      "explanation": "why this is correct"
    }
  ]
  
  Return ONLY valid JSON, no other text.`;
  
    try {
      const out = await this.provider.chat({
        messages: [{ role: 'user', content: prompt }],
        maxOutputTokens: 1500,
        temperature: 0.5,
      });
      const jsonMatch = out.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return { questions: JSON.parse(jsonMatch[0]) };
      }
      return { questions: [], raw: out.text };
    } catch (e: any) {
      return {
        questions: Array.from({ length: count }, (_, i) => ({
          question: `Question ${i + 1}: What is a key concept from this lesson?`,
          type: 'multiple_choice',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 'Option A',
          explanation: 'Review the lesson content for the correct answer.',
        }))
      };
    }
  }
  
  async improveText(userId: string, input: {
    text: string;
    instruction: 'simplify' | 'expand' | 'formal' | 'engaging';
  }) {
    const instructionMap = {
      simplify: 'Rewrite this text to be simpler and easier to understand for beginners. Use short sentences.',
      expand: 'Expand this text with more detail, examples, and explanation while keeping it clear.',
      formal: 'Rewrite this text in a professional, formal academic tone.',
      engaging: 'Rewrite this text to be more engaging, conversational, and motivating for learners.',
    };
    
    const prompt = `${instructionMap[input.instruction]}
  
  Original text:
  ${input.text.slice(0, 2000)}
  
  Return ONLY the improved text, no introduction or explanation.`;
  
    try {
      const out = await this.provider.chat({
        messages: [{ role: 'user', content: prompt }],
        maxOutputTokens: 800,
        temperature: 0.7,
      });
      return { improvedText: out.text.trim() };
    } catch (e: any) {
      return { improvedText: input.text, error: 'AI unavailable, returning original text' };
    }
  }

  async streamLessonChat(
    userId: string,
    input: { lessonId?: string; lessonSlug?: string; sessionId?: string; message: string; mode: AiMode },
    res: Response,
  ): Promise<void> {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const send = (data: object | string) => {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      res.write(`data: ${payload}\n\n`);
    };

    try {
      if (!(await this.limiter.tryConsume(userId, 1))) {
        send({ error: 'Rate limit exceeded' });
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      const lesson = await this.getLessonAccessibleByIdOrSlug({
        lessonId: input.lessonId,
        lessonSlug: input.lessonSlug,
      });
      await this.access.assertLessonUnlocked(userId, lesson);

      const session = await this.getOrCreateSession(userId, lesson.id, input.sessionId);
      const windowed = await this.recentMessagesForSession(session.id);
      const course = await this.getCourseAccessibleByIdOrSlug({ courseId: lesson.module.course.id });
      const learnerProgress = await this.learnerProgressSummaryForCourse(userId, course);
      const learningContext = buildLessonLearningContext({
        courseTitle: lesson.module.course.title,
        moduleOrder: typeof lesson.module.order === 'number' ? lesson.module.order : null,
        moduleTitle: lesson.module.title,
        lessonTitle: lesson.title,
        progressNote: learnerProgress.progressNote,
        nextStepLabel: learnerProgress.nextStepLabel,
        checkpointPending: learnerProgress.checkpointPending,
      });

      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
      const userName = profile?.fullName ?? user?.email?.split('@')[0] ?? 'Learner';
      const userLevel = profile?.level ?? 1;

      const maxContextChars = 3500;
      const lessonCtx = lessonContextFromBlocks(
        lesson.blocks.map((b) => ({ type: b.type, content: b.content })),
        maxContextChars,
      );

      const system = systemPromptForMode(input.mode);
      const context = [
        `Course title: ${lesson.module.course.title}`,
        `Module title: ${lesson.module.title}`,
        `Lesson title: ${lesson.title}`,
        lesson.learningObjective ? `Objective: ${lesson.learningObjective}` : '',
        `Student name: ${userName}`,
        `Student level: ${userLevel}`,
        learnerProgress.progressNote ?? '',
        learningContext.currentModuleLabel ? `Current module: ${learningContext.currentModuleLabel}` : '',
        learningContext.nextStepLabel ? `Immediate next step: ${learningContext.nextStepLabel}` : '',
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

      // Persist user message
      await this.prisma.aiMessage.create({
        data: { sessionId: session.id, role: AiMessageRole.user, content: input.message },
      });

      let fullText = '';

      try {
        if (!this.provider.stream) {
          throw new Error('Provider does not support streaming');
        }

        const stream = await this.provider.stream({
          messages,
          maxOutputTokens: Number(this.config.get('AI_MAX_OUTPUT_TOKENS') ?? 800),
          temperature: 0.4,
        });

        for await (const chunk of stream) {
          fullText += chunk;
          send({ chunk });
        }
      } catch (e: any) {
        // Provider unavailable - stream fallback text
        this.logger.warn(`stream provider failure user=${userId} lesson=${lesson.id}`);
        const fallbackText = fallbackTextForLesson(lesson, input.mode, input.message, { name: userName, email: user?.email, xp: profile?.xp ?? 0 });
        if (fallbackText) {
          const words = fallbackText.split(' ');
          for (const word of words) {
            fullText += word + ' ';
            send({ chunk: word + ' ' });
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
        }
      }

      // Save assistant message to DB
      if (fullText.trim()) {
        await this.prisma.aiMessage.create({
          data: { sessionId: session.id, role: AiMessageRole.assistant, content: fullText.trim() },
        });
      }

      send('[DONE]');
      res.end();
    } catch (e: any) {
      this.logger.error(`streamLessonChat error: ${e?.message}`);
      send({ error: e?.message ?? 'An error occurred' });
      send('[DONE]');
      res.end();
    }
  }

  async submitFeedback(userId: string, messageId: string, feedback: { rating: number; comment?: string }) {
    // Verify message belongs to user's session
    const message = await this.prisma.aiMessage.findUnique({
      where: { id: messageId },
      include: { session: true },
    });
    if (!message || message.session.userId !== userId) {
      throw new ForbiddenException('Message not found');
    }
    
    // Track the feedback event
    await this.events.track(userId, 'ai_feedback', {
      messageId,
      rating: feedback.rating,
      comment: feedback.comment,
      sessionId: message.sessionId,
    });
    
    return { ok: true };
  }

  async getStudyRecommendations(userId: string) {
    // Get user's recent quiz attempts with low scores
    const weakAreas = await this.prisma.quizAttempt.findMany({
      where: { userId, score: { lt: 70 } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        lesson: { select: { title: true, slug: true, module: { select: { course: { select: { title: true } } } } } },
      },
    });

    // Get incomplete enrollments
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            modules: {
              where: { deletedAt: null },
              include: {
                lessons: {
                  where: { deletedAt: null, status: 'published' },
                  include: { lessonProgress: { where: { userId } } },
                },
              },
            },
          },
        },
      },
    });

    // Find next incomplete lesson for each enrollment
    const nextLessons = enrollments.map(enrollment => {
      const course = enrollment.course;
      for (const module of course.modules) {
        for (const lesson of module.lessons) {
          const prog = lesson.lessonProgress[0];
          if (!prog?.completedAt) {
            return {
              courseTitle: course.title,
              lessonTitle: lesson.title,
              lessonSlug: lesson.slug,
              reason: 'Continue your progress',
            };
          }
        }
      }
      return null;
    }).filter(Boolean).slice(0, 3);

    return {
      nextLessons,
      weakAreas: weakAreas.map(a => ({
        lessonSlug: a.lesson?.slug,
        lessonTitle: a.lesson?.title ?? 'Unknown',
        courseTitle: a.lesson?.module?.course?.title ?? 'Unknown',
        score: a.score,
        reason: `You scored ${a.score}% — review this lesson`,
      })),
      studyTip: this.getStudyTip(),
    };
  }

  private getStudyTip(): string {
    const tips = [
      'Study in 25-minute focused sessions with 5-minute breaks (Pomodoro technique).',
      'Review material within 24 hours to boost retention by up to 80%.',
      'Teaching concepts to others is the fastest way to truly understand them.',
      'Spaced repetition: revisit older material every few days for long-term retention.',
      'Active recall — close your notes and try to remember key points — beats re-reading.',
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }
}

