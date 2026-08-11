import { ContentStatus } from '../../prisma-enums';

type QuizShape = {
  id: string;
  status: ContentStatus;
  deletedAt?: Date | null;
} | null;

export type ModuleLessonProgressShape = {
  id: string;
  title: string;
  slug: string;
  order: number;
  estimatedMinutes?: number | null;
  learningObjective?: string | null;
  quiz?: QuizShape;
};

export type ModuleProgressShape = {
  id: string;
  title: string;
  order: number;
  description?: string | null;
  introVideoUrl?: string | null;
  introVideoAsset?: {
    id: string;
    title?: string;
    url: string;
    altText?: string | null;
  } | null;
  lessons: ModuleLessonProgressShape[];
};

export type DerivedModuleProgressState = {
  totalLessons: number;
  completedLessons: number;
  percent: number;
  completed: boolean;
  status: 'completed' | 'in_progress' | 'not_started';
  checkpointRequired: boolean;
  checkpointPassed: boolean;
  checkpointLessonId: string | null;
  checkpointLessonSlug: string | null;
  checkpointLessonTitle: string | null;
};

export function getModuleCheckpointLesson(module: ModuleProgressShape): ModuleLessonProgressShape | null {
  const checkpointLesson = [...module.lessons]
    .sort((left, right) => left.order - right.order)
    .reverse()
    .find((lesson) => {
      const quiz = lesson.quiz;
      return Boolean(quiz && quiz.status === ContentStatus.published && !quiz.deletedAt);
    });

  return checkpointLesson ?? null;
}

export function deriveModuleProgressState(
  module: ModuleProgressShape,
  completedLessonIds: Set<string>,
  passedCheckpointLessonIds: Set<string>,
): DerivedModuleProgressState {
  const totalLessons = module.lessons.length;
  const completedLessons = module.lessons.filter((lesson) => completedLessonIds.has(lesson.id)).length;
  const percent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
  const checkpointLesson = getModuleCheckpointLesson(module);
  const checkpointRequired = Boolean(checkpointLesson);
  const checkpointPassed = checkpointLesson ? passedCheckpointLessonIds.has(checkpointLesson.id) : false;
  const completed =
    totalLessons > 0 && completedLessons === totalLessons && (!checkpointRequired || checkpointPassed);
  const status: DerivedModuleProgressState['status'] = completed
    ? 'completed'
    : completedLessons > 0 || checkpointPassed
      ? 'in_progress'
      : 'not_started';

  return {
    totalLessons,
    completedLessons,
    percent,
    completed,
    status,
    checkpointRequired,
    checkpointPassed,
    checkpointLessonId: checkpointLesson?.id ?? null,
    checkpointLessonSlug: checkpointLesson?.slug ?? null,
    checkpointLessonTitle: checkpointLesson?.title ?? null,
  };
}
