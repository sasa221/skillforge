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

export const LessonProgressStatus = {
  not_started: 'not_started',
  in_progress: 'in_progress',
  completed: 'completed',
} as const;
export type LessonProgressStatus =
  (typeof LessonProgressStatus)[keyof typeof LessonProgressStatus];

export const ContentReviewStatus = {
  draft: 'draft',
  submitted: 'submitted',
  changes_requested: 'changes_requested',
  approved: 'approved',
} as const;
export type ContentReviewStatus =
  (typeof ContentReviewStatus)[keyof typeof ContentReviewStatus];

export const QuestionType = {
  multiple_choice: 'multiple_choice',
  true_false: 'true_false',
  short_answer: 'short_answer',
  ordered: 'ordered',
} as const;
export type QuestionType = (typeof QuestionType)[keyof typeof QuestionType];

export const UserRoleType = {
  student: 'student',
  instructor: 'instructor',
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
  video: 'video',
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
  quick_learner: 'quick_learner',
  streak_7: 'streak_7',
  quiz_master: 'quiz_master',
  course_collector: 'course_collector',
  night_owl: 'night_owl',
} as const;
export type AchievementType = (typeof AchievementType)[keyof typeof AchievementType];

export const AiMessageRole = {
  system: 'system',
  user: 'user',
  assistant: 'assistant',
  tool: 'tool',
} as const;

export const MediaAssetType = {
  image: 'image',
  video: 'video',
  file: 'file',
} as const;
export type MediaAssetType = (typeof MediaAssetType)[keyof typeof MediaAssetType];

export const MediaAssetSourceType = {
  external: 'external',
  upload: 'upload',
  generated: 'generated',
} as const;
export type MediaAssetSourceType =
  (typeof MediaAssetSourceType)[keyof typeof MediaAssetSourceType];

export const ContentRevisionTarget = {
  course: 'course',
  module: 'module',
  lesson: 'lesson',
  quiz: 'quiz',
} as const;
export type ContentRevisionTarget =
  (typeof ContentRevisionTarget)[keyof typeof ContentRevisionTarget];
