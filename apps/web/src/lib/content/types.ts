import type { UserRoleType } from '@/lib/auth/types';

export type ContentStatus = 'draft' | 'published' | 'archived';
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type Skill = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: ContentStatus;
  order: number;
};

export type CourseSkill = {
  id: string;
  skill: Skill;
};

export type LessonSummary = {
  id: string;
  title: string;
  slug: string;
  learningObjective: string | null;
  estimatedMinutes: number | null;
  order: number;
  status: ContentStatus;
};

export type ModuleSummary = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  status: ContentStatus;
  lessons: LessonSummary[];
};

export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  difficulty: CourseDifficulty;
  estimatedMinutes: number | null;
  tags: string[];
  status: ContentStatus;
  order: number;
  skills: CourseSkill[];
};

export type CourseDetail = Course & {
  modules: ModuleSummary[];
};

export type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  createdAt: string;
  updatedAt: string;
  course: CourseDetail;
};

export type LessonBlockType =
  | 'heading'
  | 'paragraph'
  | 'bullet_list'
  | 'code_block'
  | 'image'
  | 'callout'
  | 'example'
  | 'recap'
  | 'checkpoint_intro';

export type LessonBlock = {
  id: string;
  type: LessonBlockType;
  order: number;
  content: any;
};

export type LessonNavItem = { id: string; title: string; slug: string; order: number };

export type LessonDetail = {
  id: string;
  title: string;
  slug: string;
  learningObjective: string | null;
  estimatedMinutes: number | null;
  status: ContentStatus;
  blocks: LessonBlock[];
  module: { id: string; title: string; order: number };
  course: { id: string; title: string; slug: string };
  navigation: {
    prev: LessonNavItem | null;
    next: LessonNavItem | null;
    siblings: LessonNavItem[];
  };
};

export type MeUser = {
  id: string;
  email: string;
  roles: UserRoleType[];
};

export type QuizQuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'ordered';

export type QuizQuestionOption = { id: string; text: string; order: number };

export type QuizQuestion = {
  id: string;
  type: QuizQuestionType;
  difficulty: number;
  prompt: string;
  order: number;
  options: QuizQuestionOption[];
};

export type LessonQuizResponse =
  | { hasQuiz: false }
  | {
      hasQuiz: true;
      quiz: {
        id: string;
        lessonId: string;
        title: string | null;
        passingScore: number;
        questions: QuizQuestion[];
      };
    };

export type SubmitQuizAnswer = {
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
};

export type QuizSubmitResult = {
  attemptId: string;
  score: number;
  passed: boolean;
  passingScore: number;
  questions: Array<{
    questionId: string;
    isCorrect: boolean;
    explanation: string | null;
    correctOption: { id: string; text: string } | null;
  }>;
};

export type CourseProgress = {
  course: { id: string; title: string; slug: string };
  percent: number;
  completedLessons: number;
  totalLessons: number;
  modules: Array<{
    id: string;
    title: string;
    order: number;
    percent: number;
    lessons: Array<{ id: string; title: string; slug: string; order: number; completed: boolean }>;
  }>;
};

export type DashboardProgress = {
  xp: number;
  level: number;
  streakDays: number;
  enrollmentsCount: number;
  completedLessonsCount: number;
  completedCoursesCount: number;
  recentBadges: Array<{ key: string; title: string; description: string | null; awardedAt: string }>;
  recentAchievements: Array<{
    type: string;
    title: string;
    description: string | null;
    awardedAt: string;
  }>;
  continueLesson:
    | null
    | { slug: string; title: string; courseSlug: string; courseTitle: string };
  recentQuizAttempts: Array<{
    id: string;
    score: number;
    passed: boolean;
    createdAt: string;
    lesson: { title: string; slug: string };
  }>;
};

export type ProfileProgress = {
  xp: number;
  level: number;
  badges: Array<{ key: string; title: string; description: string | null }>;
  achievements: Array<{ type: string; title: string; description: string | null }>;
  courses: Array<{
    course: { id: string; title: string; slug: string };
    percent: number;
    status: string;
    completedAt: string | null;
  }>;
};

export type AiChatMode =
  | 'explain'
  | 'simplify'
  | 'give_example'
  | 'summarize'
  | 'hint'
  | 'quiz_me'
  | 'explain_wrong_answer';

export type AiChatMessage = {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type AiLessonChatResponse = {
  sessionId: string;
  reply: string;
  messages: AiChatMessage[];
};

export type AiLessonHistoryResponse = {
  sessionId: string | null;
  messages: AiChatMessage[];
};

export type AiExplainAnswerResponse = {
  explanation: string;
};

export type AdminOverview = {
  totalUsers: number;
  activeEnrollments: number;
  totalSkills: number;
  totalCourses: number;
  totalLessons: number;
  totalQuizzes: number;
  completedCourses: number;
  totalQuizAttempts: number;
};

export type AdminContentStats = {
  skills: Record<string, number>;
  courses: Record<string, number>;
  modules: Record<string, number>;
  lessons: Record<string, number>;
  quizzes: Record<string, number>;
};

export type AdminUserList = {
  page: number;
  pageSize: number;
  total: number;
  items: Array<{
    id: string;
    email: string;
    createdAt: string;
    roles: string[];
    profile: null | { fullName: string; xp: number; level: number };
  }>;
};

export type AdminSkill = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: ContentStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type AdminCourseListItem = Course & {
  moduleCount: number;
  lessonCount: number;
};

export type AdminModule = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  order: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type AdminLesson = {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  learningObjective: string | null;
  aiPromptSeed: string | null;
  estimatedMinutes: number | null;
  order: number;
  status: ContentStatus;
  blocks: Array<{ id: string; type: string; order: number; content: any }>;
  quiz: null | { id: string; passingScore: number; status: ContentStatus };
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type AdminQuiz = {
  id: string;
  lessonId: string;
  title: string | null;
  passingScore: number;
  status: ContentStatus;
  deletedAt: string | null;
  lesson?: { id: string; title: string };
  questions?: Array<{
    id: string;
    type: string;
    difficulty: number;
    prompt: string;
    explanation: string | null;
    order: number;
    correctOptionId: string | null;
    options: Array<{ id: string; text: string; order: number }>;
  }>;
};

