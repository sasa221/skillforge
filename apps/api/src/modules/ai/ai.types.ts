export type AiMode =
  | 'explain'
  | 'simplify'
  | 'give_example'
  | 'summarize'
  | 'hint'
  | 'quiz_me'
  | 'study_plan'
  | 'check_my_answer'
  | 'explain_wrong_answer';

export type ProviderChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type AiSourceReference = {
  id: string;
  kind: 'course' | 'module' | 'lesson';
  title: string;
  subtitle?: string;
  snippet?: string;
};

export type AiLearningContext = {
  scope: 'lesson' | 'course';
  courseTitle: string;
  currentModuleLabel: string | null;
  currentLessonLabel: string | null;
  nextStepLabel: string | null;
  progressNote: string | null;
  checkpointPending: boolean;
};

export type AiStructuredResponse =
  | {
      type: 'study_plan';
      focus: string | null;
      progressNote: string | null;
      currentModuleLabel: string | null;
      nextStepLabel: string | null;
      checkpointPending: boolean;
      steps: string[];
      checkForUnderstanding: string[];
    }
  | {
      type: 'quiz';
      progressNote: string | null;
      currentModuleLabel: string | null;
      nextStepLabel: string | null;
      checkpointPending: boolean;
      questions: string[];
      answerPrompt: string | null;
    }
  | {
      type: 'check_my_answer';
      progressNote: string | null;
      currentModuleLabel: string | null;
      nextStepLabel: string | null;
      checkpointPending: boolean;
      verdict: string | null;
      confidenceLabel: string | null;
      confidenceScore: number | null;
      correct: string[];
      missing: string[];
      improve: string[];
    }
  | {
      type: 'explain_wrong_answer';
      progressNote: string | null;
      currentModuleLabel: string | null;
      nextStepLabel: string | null;
      checkpointPending: boolean;
      verdict: string | null;
      whyWrong: string[];
      correctAnswer: string | null;
      memoryTips: string[];
      nextTry: string[];
    };

export type AiProviderStatus = 'ok' | 'fallback' | 'unavailable';

