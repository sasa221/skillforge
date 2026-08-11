import type { UserRoleType } from '@/lib/auth/types';

export type ContentStatus = 'draft' | 'published' | 'archived';
export type ContentReviewStatus =
  | 'draft'
  | 'submitted'
  | 'changes_requested'
  | 'approved';
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type MediaAssetType = 'image' | 'video' | 'file';
export type MediaAssetSourceType = 'external' | 'upload' | 'generated';

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

export type Instructor = {
  id: string;
  fullName: string;
  slug: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  avatarAssetId?: string | null;
  avatarAsset?: MediaAsset | null;
  status: ContentStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type PublicInstructorCourse = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  difficulty: CourseDifficulty;
  estimatedMinutes: number | null;
  tags: string[];
  coverImageUrl: string | null;
  coverImageAsset: MediaAsset | null;
  skills: CourseSkill[];
};

export type PublicInstructorProfile = Instructor & {
  courses: PublicInstructorCourse[];
  stats: {
    publishedCourses: number;
    guidedHours: number;
    coveredSkills: number;
  };
  focusSkills: string[];
};

export type MediaAsset = {
  id: string;
  title: string;
  altText: string | null;
  url: string;
  mimeType: string | null;
  sizeBytes: number | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  type: MediaAssetType;
  sourceType: MediaAssetSourceType;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
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
  introVideoUrl: string | null;
  introVideoAsset: MediaAsset | null;
  order: number;
  status: ContentStatus;
  lessons: LessonSummary[];
};

export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  instructorId?: string | null;
  coverImageAssetId?: string | null;
  introVideoAssetId?: string | null;
  coverImageUrl: string | null;
  introVideoUrl: string | null;
  instructor: Instructor | null;
  coverImageAsset: MediaAsset | null;
  introVideoAsset: MediaAsset | null;
  difficulty: CourseDifficulty;
  estimatedMinutes: number | null;
  tags: string[];
  requiresSequentialModules: boolean;
  status: ContentStatus;
  reviewStatus: ContentReviewStatus;
  reviewNotes: string | null;
  order: number;
  skills: CourseSkill[];
};

export type CourseDetail = Course & {
  modules: ModuleSummary[];
  revisions?: AdminContentRevision[];
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
  | 'video'
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
  module: {
    id: string;
    title: string;
    order: number;
    introVideoUrl: string | null;
    introVideoAsset: MediaAsset | null;
  };
  course: { id: string; title: string; slug: string };
  navigation: {
    prev: LessonNavItem | null;
    next: LessonNavItem | null;
    siblings: LessonNavItem[];
  };
  moduleLeaderboard: Array<{
    userId: string;
    name: string;
    initials: string;
    rank: number;
    xp: number;
    completedLessons: number;
    totalLessons: number;
    percent: number;
    isCurrentUser: boolean;
  }>;
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
  orderedAnswer?: string[];
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
  course: { id: string; title: string; slug: string; requiresSequentialModules: boolean };
  percent: number;
  completedLessons: number;
  totalLessons: number;
  modules: Array<{
    id: string;
    title: string;
    description: string | null;
    introVideoUrl: string | null;
    introVideoAsset: MediaAsset | null;
    order: number;
    percent: number;
    locked: boolean;
    completed: boolean;
    checkpointRequired: boolean;
    checkpointPassed: boolean;
    checkpointLessonId: string | null;
    checkpointLessonSlug: string | null;
    checkpointLessonTitle: string | null;
    lessons: Array<{ id: string; title: string; slug: string; order: number; completed: boolean; locked: boolean }>;
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
  activeCourse:
    | null
    | {
        slug: string;
        title: string;
        difficulty: CourseDifficulty;
        coverImageUrl: string | null;
        coverImageAsset: MediaAsset | null;
        instructor: Instructor | null;
        percent: number;
        completedLessons: number;
        totalLessons: number;
        completedModules: number;
        totalModules: number;
        currentModuleTitle: string | null;
        currentModuleOrder: number | null;
        nextLessonTitle: string | null;
        checkpointPending: boolean;
        checkpointLessonTitle: string | null;
        checkpointLessonSlug: string | null;
      };
  continueLesson:
    | null
    | {
        slug: string;
        title: string;
        moduleTitle: string | null;
        moduleOrder: number | null;
        checkpointPending: boolean;
        courseSlug: string;
        courseTitle: string;
        courseCoverImageUrl: string | null;
        courseCoverImageAsset: MediaAsset | null;
        instructor: Instructor | null;
      };
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
  streakDays: number;
  badges: Array<{ key: string; title: string; description: string | null }>;
  achievements: Array<{ type: string; title: string; description: string | null }>;
  courses: Array<{
    course: { id: string; title: string; slug: string };
    percent: number;
    status: string;
    completedAt: string | null;
  }>;
  stats: {
    completedCoursesCount: number;
    certificateCount: number;
    badgesCount: number;
    globalRank: number | null;
    topPercent: number | null;
    nextLevelXp: number;
    levelProgressPercent: number;
  };
  portfolioItems: Array<{
    title: string;
    percent: number;
    description: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string | null;
    href: string | null;
    createdAt: string;
  }>;
  leaderboard: Array<{
    userId: string;
    name: string;
    initials: string;
    xp: number;
    rank: number;
    isCurrentUser: boolean;
  }>;
};

export type AiChatMode =
  | 'explain'
  | 'simplify'
  | 'give_example'
  | 'summarize'
  | 'hint'
  | 'quiz_me'
  | 'study_plan'
  | 'check_my_answer'
  | 'explain_wrong_answer';

export type AiChatMessage = {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type AiProviderStatus = 'ok' | 'fallback' | 'unavailable';

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

export type AiLessonChatResponse = {
  sessionId: string;
  reply: string | null;
  providerStatus: AiProviderStatus;
  errorMessage: string | null;
  messages: AiChatMessage[];
  sources: AiSourceReference[];
  learningContext: AiLearningContext;
  structured: AiStructuredResponse | null;
};

export type AiLessonHistoryResponse = {
  sessionId: string | null;
  messages: AiChatMessage[];
  sources: AiSourceReference[];
  learningContext: AiLearningContext;
  structured: AiStructuredResponse | null;
};

export type AiCourseChatResponse = {
  sessionId: string;
  reply: string | null;
  providerStatus: AiProviderStatus;
  errorMessage: string | null;
  messages: AiChatMessage[];
  sources: AiSourceReference[];
  learningContext: AiLearningContext;
  structured: AiStructuredResponse | null;
};

export type AiCourseHistoryResponse = {
  sessionId: string | null;
  messages: AiChatMessage[];
  sources: AiSourceReference[];
  learningContext: AiLearningContext;
  structured: AiStructuredResponse | null;
};

export type AiExplainAnswerResponse = {
  explanation: string;
  providerStatus: AiProviderStatus;
  errorMessage: string | null;
  learningContext: AiLearningContext;
  structured: AiStructuredResponse | null;
};

export type NotificationFeedItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
};

export type NotificationListResponse = {
  unreadCount: number;
  items: NotificationFeedItem[];
};

export type SiteSurfaceCard = {
  icon?: string | null;
  title?: string;
  description?: string;
  type?: string;
  [key: string]: unknown;
};

export type SiteSurface = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string | null;
  description: string | null;
  body: string | null;
  bullets: string[];
  cards: SiteSurfaceCard[] | null;
  primaryCtaLabel: string | null;
  primaryCtaHref: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
  status: ContentStatus;
};

export type LearningPathCourse = {
  id: string;
  order: number;
  title: string;
  slug: string;
  description: string | null;
  difficulty: CourseDifficulty;
  estimatedMinutes: number | null;
  moduleCount: number;
  lessonCount: number;
  coverImageUrl: string | null;
  coverImageAsset: MediaAsset | null;
  instructor: null | {
    id: string;
    fullName: string;
    slug: string;
    title: string | null;
    avatarUrl: string | null;
    avatarAsset: MediaAsset | null;
  };
  skills: Array<{
    id: string;
    title: string;
    slug: string;
  }>;
};

export type PublicLearningPath = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  order: number;
  isFallback: boolean;
  courseCount: number;
  totalLessons: number;
  totalMinutes: number;
  coveredSkills: number;
  courses: LearningPathCourse[];
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

export type AdminReviewQueueItem = {
  id: string;
  entityType: 'course' | 'module' | 'lesson';
  title: string;
  slug: string | null;
  status: ContentStatus;
  reviewStatus: ContentReviewStatus;
  reviewNotes: string | null;
  updatedAt: string;
  editHref: string;
  course: null | {
    id: string;
    title: string;
    slug: string;
  };
  module: null | {
    id: string;
    title: string;
  };
  instructor: null | {
    id: string;
    fullName: string;
    slug: string;
    title: string | null;
    avatarUrl: string | null;
    avatarAsset: MediaAsset | null;
  };
};

export type AdminReviewQueueResponse = {
  statusFilter: 'pending' | 'submitted' | 'changes_requested' | 'approved' | 'draft' | 'all';
  typeFilter: 'all' | 'course' | 'module' | 'lesson';
  summary: {
    total: number;
    submitted: number;
    changesRequested: number;
    approved: number;
    draft: number;
    needsAttention: number;
    byType: {
      course: number;
      module: number;
      lesson: number;
    };
  };
  items: AdminReviewQueueItem[];
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
  role: 'all' | UserRoleType;
  total: number;
  stats: {
    totalUsers: number;
    adminCount: number;
    studentCount: number;
    newSignupCount: number;
  };
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

export type AdminContentRevision = {
  id: string;
  summary: string;
  status: ContentStatus;
  createdAt: string;
  snapshot?: Record<string, unknown> | null;
  actor: null | {
    id: string;
    email: string;
    profile: null | {
      fullName: string;
    };
  };
};

export type AdminModule = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  introVideoUrl: string | null;
  introVideoAssetId?: string | null;
  introVideoAsset: MediaAsset | null;
  order: number;
  status: ContentStatus;
  reviewStatus: ContentReviewStatus;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  revisions?: AdminContentRevision[];
};

export type AdminInstructorLinkedCourse = {
  id: string;
  title: string;
  slug: string;
  status: ContentStatus;
};

export type AdminInstructorLinkedUser = {
  id: string;
  email: string;
  fullName: string | null;
  roles: UserRoleType[];
};

export type AdminInstructor = Instructor & {
  courses: AdminInstructorLinkedCourse[];
  linkedUser: AdminInstructorLinkedUser | null;
};

export type InstructorWorkspaceCourse = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  difficulty: CourseDifficulty;
  status: ContentStatus;
  reviewStatus: ContentReviewStatus;
  reviewNotes: string | null;
  updatedAt: string;
  moduleCount: number;
  lessonCount: number;
};

export type InstructorWorkspaceResponse = {
  instructor: null | {
    id: string;
    userId: string | null;
    slug: string;
    fullName: string;
    title: string | null;
    bio: string | null;
    status: ContentStatus;
    avatarUrl: string | null;
  };
  stats: {
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    totalModules: number;
    totalLessons: number;
  };
  courses: InstructorWorkspaceCourse[];
};

export type AdminMediaAssetUsageCourse = {
  id: string;
  title: string;
  slug: string;
  status: ContentStatus;
};

export type AdminMediaAssetUsageModule = {
  id: string;
  title: string;
  status: ContentStatus;
  course: {
    id: string;
    title: string;
    slug: string;
  };
};

export type AdminMediaAssetUsageInstructor = {
  id: string;
  fullName: string;
  slug: string;
  status: ContentStatus;
};

export type AdminMediaAsset = MediaAsset & {
  uploadedBy?: {
    id: string;
    email: string;
    fullName: string | null;
  } | null;
  usage?: {
    totalLinks: number;
    coverCourses: AdminMediaAssetUsageCourse[];
    introCourses: AdminMediaAssetUsageCourse[];
    introModules: AdminMediaAssetUsageModule[];
    avatarInstructors: AdminMediaAssetUsageInstructor[];
  };
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
  reviewStatus: ContentReviewStatus;
  reviewNotes: string | null;
  blocks: Array<{ id: string; type: string; order: number; content: any }>;
  quiz: null | { id: string; passingScore: number; status: ContentStatus };
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  revisions?: AdminContentRevision[];
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
    correctText?: string | null;
    correctOrder?: string[];
    options: Array<{ id: string; text: string; order: number }>;
  }>;
  revisions?: AdminContentRevision[];
};

