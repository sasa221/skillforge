/**
 * Enum values matching apps/api/prisma/schema.prisma.
 * Used instead of @prisma/client enums to avoid import failures when
 * the Prisma client is not yet generated (e.g. fresh clone, CI).
 */
export const ContentStatus = {
  draft: 'draft',
  published: 'published',
  archived: 'archived',
} as const;
export type ContentStatus = (typeof ContentStatus)[keyof typeof ContentStatus];

export const QuestionType = {
  multiple_choice: 'multiple_choice',
  true_false: 'true_false',
  short_answer: 'short_answer',
  ordered: 'ordered',
} as const;
export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export const UserRoleType = {
  student: 'student',
  admin: 'admin',
  content_manager: 'content_manager',
  super_admin: 'super_admin',
} as const;
export type UserRoleType = (typeof UserRoleType)[keyof typeof UserRoleType];

export const CourseDifficulty = {
  beginner: 'beginner',
  intermediate: 'intermediate',
  advanced: 'advanced',
} as const;
export type CourseDifficulty = (typeof CourseDifficulty)[keyof typeof CourseDifficulty];

export const LessonBlockType = {
  heading: 'heading',
  paragraph: 'paragraph',
  bullet_list: 'bullet_list',
  code_block: 'code_block',
  image: 'image',
  callout: 'callout',
  example: 'example',
  recap: 'recap',
  checkpoint_intro: 'checkpoint_intro',
} as const;
export type LessonBlockType = (typeof LessonBlockType)[keyof typeof LessonBlockType];

export const AchievementType = {
  first_lesson_completed: 'first_lesson_completed',
  first_quiz_passed: 'first_quiz_passed',
  first_course_completed: 'first_course_completed',
} as const;

export const AiMessageRole = {
  system: 'system',
  user: 'user',
  assistant: 'assistant',
  tool: 'tool',
} as const;
