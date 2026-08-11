import { ContentStatus } from '../../prisma-enums';
import { deriveModuleProgressState, getModuleCheckpointLesson } from './module-progress.util';

describe('module progress utility', () => {
  const moduleShape = {
    id: 'module-1',
    title: 'Getting Comfortable',
    order: 0,
    description: null,
    introVideoUrl: null,
    lessons: [
      {
        id: 'lesson-1',
        title: 'Cells vs Ranges',
        slug: 'cells-vs-ranges',
        order: 0,
        estimatedMinutes: 10,
        learningObjective: null,
        quiz: null,
      },
      {
        id: 'lesson-2',
        title: 'Cell References',
        slug: 'cell-references',
        order: 1,
        estimatedMinutes: 10,
        learningObjective: null,
        quiz: null,
      },
      {
        id: 'lesson-3',
        title: 'Relative vs Absolute References',
        slug: 'relative-vs-absolute-references',
        order: 2,
        estimatedMinutes: 10,
        learningObjective: null,
        quiz: {
          id: 'quiz-1',
          status: ContentStatus.published,
          deletedAt: null,
        },
      },
    ],
  };

  it('uses the last published lesson with a published quiz as the checkpoint lesson', () => {
    const checkpoint = getModuleCheckpointLesson(moduleShape);

    expect(checkpoint?.id).toBe('lesson-3');
    expect(checkpoint?.title).toBe('Relative vs Absolute References');
  });

  it('does not mark the module complete until the checkpoint quiz is passed', () => {
    const completedLessonIds = new Set(['lesson-1', 'lesson-2', 'lesson-3']);
    const passedCheckpointLessonIds = new Set<string>();

    const derived = deriveModuleProgressState(moduleShape, completedLessonIds, passedCheckpointLessonIds);

    expect(derived.checkpointRequired).toBe(true);
    expect(derived.checkpointPassed).toBe(false);
    expect(derived.completed).toBe(false);
    expect(derived.status).toBe('in_progress');
  });

  it('marks the module complete after the checkpoint quiz is passed', () => {
    const completedLessonIds = new Set(['lesson-1', 'lesson-2', 'lesson-3']);
    const passedCheckpointLessonIds = new Set(['lesson-3']);

    const derived = deriveModuleProgressState(moduleShape, completedLessonIds, passedCheckpointLessonIds);

    expect(derived.checkpointRequired).toBe(true);
    expect(derived.checkpointPassed).toBe(true);
    expect(derived.completed).toBe(true);
    expect(derived.status).toBe('completed');
  });
});
