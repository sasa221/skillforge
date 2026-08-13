import type { MeUser, UserRoleType } from '@/lib/auth/types';
import type { Profile } from '@/lib/profile/types';
import { apiFetch } from '@/lib/api/client';
import type {
  Course,
  CourseDetail,
  CourseProgress,
  DashboardProgress,
  Enrollment,
  PublicInstructorProfile,
  LessonDetail,
  LessonQuizResponse,
  ProfileProgress,
  QuizSubmitResult,
  Skill,
  SubmitQuizAnswer,
  AiExplainAnswerResponse,
  AiLessonChatResponse,
  AiLessonHistoryResponse,
  AiChatMode,
  AdminContentStats,
  AdminCourseListItem,
  AdminInstructor,
  AdminLesson,
  AdminMediaAsset,
  AdminModule,
  AdminOverview,
  AdminReviewQueueResponse,
  AdminQuiz,
  AdminSkill,
  AdminUserList,
  AiCourseChatResponse,
  AiCourseHistoryResponse,
  SiteSurface,
  NotificationListResponse,
  InstructorWorkspaceResponse,
  PublicLearningPath,
} from '@/lib/content/types';

export const usersApi = {
  me: () => apiFetch<MeUser>('/users/me', { method: 'GET' }),
  patchMe: (input: { email?: string }) =>
    apiFetch<MeUser>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(input),
      headers: { 'content-type': 'application/json' },
    }),
};

export const profilesApi = {
  me: () => apiFetch<Profile>('/profiles/me', { method: 'GET' }),
  patchMe: (input: {
    fullName?: string;
    avatarUrl?: string;
    bio?: string;
    learningGoals?: string;
    interests?: string[];
  }) =>
    apiFetch<Profile>('/profiles/me', {
      method: 'PATCH',
      body: JSON.stringify(input),
      headers: { 'content-type': 'application/json' },
    }),
};

export const skillsApi = {
  list: () => apiFetch<Skill[]>('/skills', { method: 'GET', auth: false }),
};

export const coursesApi = {
  list: () => apiFetch<any>('/courses', { method: 'GET', auth: false }).then(res => (Array.isArray(res) ? res : (res.courses || [])) as Course[]),
  bySlug: (slug: string) => apiFetch<CourseDetail>(`/courses/${slug}`, { method: 'GET', auth: false }),
  search: (params: { q?: string; skillSlug?: string; difficulty?: string; page?: number }) =>
    apiFetch<any>(`/courses?${new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined) as any).toString()}`, { method: 'GET', auth: false }),
  reviews: (courseId: string) => apiFetch<{ avgRating: number; totalCount: number; reviews: any[] }>(`/courses/${courseId}/reviews`, { method: 'GET', auth: false }),
  addReview: (courseId: string, body: { rating: number; comment: string }) =>
    apiFetch<any>(`/courses/${courseId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
  discussions: (courseId: string) =>
    apiFetch<{ discussions: any[] }>(`/courses/${courseId}/discussions`, { method: 'GET', auth: false }),
  createDiscussion: (courseId: string, body: { title: string; content: string }) =>
    apiFetch<any>(`/courses/${courseId}/discussions`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
  addDiscussionReply: (courseId: string, discussionId: string, body: { content: string }) =>
    apiFetch<any>(`/courses/${courseId}/discussions/${discussionId}/replies`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
  announcements: (courseId: string) =>
    apiFetch<{ announcements: any[] }>(`/courses/${courseId}/announcements`, { method: 'GET', auth: false }),
  createAnnouncement: (courseId: string, body: { title: string; message: string; isUrgent?: boolean }) =>
    apiFetch<any>(`/courses/${courseId}/announcements`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
};

export const instructorsApi = {
  list: () => apiFetch<PublicInstructorProfile[]>('/instructors', { method: 'GET', auth: false }),
  bySlug: (slug: string) =>
    apiFetch<PublicInstructorProfile>(`/instructors/${slug}`, { method: 'GET', auth: false }),
};

export const lessonsApi = {
  bySlug: (slug: string) => apiFetch<LessonDetail>(`/lessons/${slug}`, { method: 'GET' }),
};

export const enrollmentsApi = {
  enroll: (courseId: string) =>
    apiFetch<Enrollment>(`/courses/${courseId}/enroll`, { method: 'POST' }),
  me: () => apiFetch<Enrollment[]>('/enrollments/me', { method: 'GET' }),
};

export const quizzesApi = {
  lessonQuiz: (lessonId: string) =>
    apiFetch<LessonQuizResponse>(`/lessons/${lessonId}/quiz`, { method: 'GET' }),
  submitLessonQuiz: (lessonId: string, answers: SubmitQuizAnswer[]) =>
    apiFetch<QuizSubmitResult>(`/lessons/${lessonId}/quiz/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
      headers: { 'content-type': 'application/json' },
    }),
};


export const progressApi = {
  completeLesson: (lessonId: string) =>
    apiFetch<{ ok: true; alreadyCompleted: boolean }>(`/progress/lessons/${lessonId}/complete`, {
      method: 'POST',
    }),
  course: (courseId: string) => apiFetch<CourseProgress>(`/progress/courses/${courseId}`, { method: 'GET' }),
  dashboard: () => apiFetch<DashboardProgress>('/progress/me/dashboard', { method: 'GET' }),
  profile: () => apiFetch<ProfileProgress>('/progress/me/profile', { method: 'GET' }),
  certificates: () => apiFetch<any[]>('/progress/certificates', { method: 'GET' }),
  verifyCertificate: (code: string) => apiFetch<any>(`/progress/certificates/verify/${code}`, { method: 'GET', auth: false }),
  activityFeed: () => apiFetch<any[]>('/progress/activity-feed', { method: 'GET' }),
  activityHeatmap: () => apiFetch<{ date: string; count: number }[]>('/progress/activity-heatmap', { method: 'GET' }),
  profileSummary: () => apiFetch<any>('/progress/profile-summary', { method: 'GET' }),
  getNotes: (lessonId: string) => apiFetch<{ notes: any[] }>(`/progress/lessons/${lessonId}/notes`, { method: 'GET' }),
  createNote: (lessonId: string, body: { timestampSeconds: number; text: string }) =>
    apiFetch<any>(`/progress/lessons/${lessonId}/notes`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
  deleteNote: (lessonId: string, noteId: string) =>
    apiFetch<any>(`/progress/lessons/${lessonId}/notes/${noteId}`, { method: 'DELETE' }),
};

export const gamificationApi = {
  leaderboard: () => apiFetch<any[]>('/gamification/leaderboard', { method: 'GET' }),
};

export const aiApi = {
  lessonHistory: (lessonId: string) =>
    apiFetch<AiLessonHistoryResponse>(`/ai/lessons/${lessonId}/session`, { method: 'GET' }),
  lessonChat: (input: { lessonId: string; message: string; sessionId?: string; mode?: AiChatMode }) =>
    apiFetch<AiLessonChatResponse>('/ai/lesson-chat', {
      method: 'POST',
      body: JSON.stringify(input),
      headers: { 'content-type': 'application/json' },
    }),
  courseHistory: (courseId: string) =>
    apiFetch<AiCourseHistoryResponse>(`/ai/courses/${courseId}/session`, { method: 'GET' }),
  courseChat: (input: { courseId: string; message: string; sessionId?: string; mode?: AiChatMode }) =>
    apiFetch<AiCourseChatResponse>('/ai/course-chat', {
      method: 'POST',
      body: JSON.stringify(input),
      headers: { 'content-type': 'application/json' },
    }),
  explainAnswer: (input: {
    lessonId: string;
    questionId: string;
    selectedOptionId?: string;
    userAnswerText?: string;
    orderedAnswer?: string[];
  }) =>
    apiFetch<AiExplainAnswerResponse>('/ai/explain-answer', {
      method: 'POST',
      body: JSON.stringify(input),
      headers: { 'content-type': 'application/json' },
    }),
  recommendations: () => apiFetch<any>('/ai/recommendations', { method: 'GET' }),
};

export const siteSurfacesApi = {
  bySlug: (slug: string) =>
    apiFetch<SiteSurface>(`/site-surfaces/${slug}`, { method: 'GET', auth: false }),
};

export const learningPathsApi = {
  list: () => apiFetch<PublicLearningPath[]>('/learning-paths', { method: 'GET', auth: false }),
  bySlug: (slug: string) =>
    apiFetch<PublicLearningPath>(`/learning-paths/${slug}`, { method: 'GET', auth: false }),
};

export const eventsApi = {
  lessonOpened: (lessonId: string) =>
    apiFetch<{ ok: true }>('/events/lesson-opened', {
      method: 'POST',
      body: JSON.stringify({ lessonId }),
      headers: { 'content-type': 'application/json' },
  }),
};

export const notificationsApi = {
  list: () => apiFetch<NotificationListResponse>('/notifications/me', { method: 'GET' }),
  markRead: (id: string) =>
    apiFetch<{ id: string; readAt: string | null }>(`/notifications/${id}/read`, {
      method: 'POST',
    }),
  markAllRead: () =>
    apiFetch<{ ok: true; count: number }>('/notifications/me/read-all', {
      method: 'POST',
    }),
};

export const instructorWorkspaceApi = {
  workspace: () =>
    apiFetch<InstructorWorkspaceResponse>('/instructor/workspace', { method: 'GET' }),
  analytics: () => apiFetch<any>('/instructor/analytics', { method: 'GET' }),
  createCourse: (input: { title: string; description?: string; level?: string }) =>
    apiFetch<any>('/instructor/courses', {
      method: 'POST',
      body: JSON.stringify(input),
      headers: { 'content-type': 'application/json' },
    }),
  skills: () => apiFetch<AdminSkill[]>('/instructor/skills', { method: 'GET' }),
  mediaAssets: () => apiFetch<AdminMediaAsset[]>('/instructor/media-assets', { method: 'GET' }),
  uploadMediaAsset: (input: { file: File; title?: string; altText?: string; status?: string }) => {
    const form = new FormData();
    form.append('file', input.file);
    if (input.title) form.append('title', input.title);
    if (input.altText) form.append('altText', input.altText);
    if (input.status) form.append('status', input.status);
    return apiFetch<AdminMediaAsset>('/instructor/media-assets/upload', {
      method: 'POST',
      body: form,
    });
  },
  students: () => apiFetch<any>('/instructor/students', { method: 'GET' }),
  courses: {
    get: (id: string) => apiFetch<CourseDetail>(`/instructor/courses/${id}`, { method: 'GET' }),
    update: (id: string, input: any) =>
      apiFetch<CourseDetail>(`/instructor/courses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
    restoreRevision: (id: string, revisionId: string) =>
      apiFetch<CourseDetail>(`/instructor/courses/${id}/revisions/${revisionId}/restore`, {
        method: 'POST',
      }),
    submitReview: (id: string, notes?: string) =>
      apiFetch<CourseDetail>(`/instructor/courses/${id}/submit-review`, {
        method: 'POST',
        body: JSON.stringify(notes ? { notes } : {}),
        headers: { 'content-type': 'application/json' },
      }),
    modules: (courseId: string) =>
      apiFetch<AdminModule[]>(`/instructor/courses/${courseId}/modules`, { method: 'GET' }),
    createModule: (courseId: string, input: any) =>
      apiFetch<AdminModule>(`/instructor/courses/${courseId}/modules`, {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
  },
  modules: {
    get: (id: string) => apiFetch<AdminModule>(`/instructor/modules/${id}`, { method: 'GET' }),
    update: (id: string, input: any) =>
      apiFetch<AdminModule>(`/instructor/modules/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
    restoreRevision: (id: string, revisionId: string) =>
      apiFetch<AdminModule>(`/instructor/modules/${id}/revisions/${revisionId}/restore`, {
        method: 'POST',
      }),
    submitReview: (id: string, notes?: string) =>
      apiFetch<AdminModule>(`/instructor/modules/${id}/submit-review`, {
        method: 'POST',
        body: JSON.stringify(notes ? { notes } : {}),
        headers: { 'content-type': 'application/json' },
      }),
    lessons: (moduleId: string) =>
      apiFetch<AdminLesson[]>(`/instructor/modules/${moduleId}/lessons`, { method: 'GET' }),
    createLesson: (moduleId: string, input: any) =>
      apiFetch<AdminLesson>(`/instructor/modules/${moduleId}/lessons`, {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
  },
  lessons: {
    get: (id: string) => apiFetch<AdminLesson>(`/instructor/lessons/${id}`, { method: 'GET' }),
    update: (id: string, input: any) =>
      apiFetch<AdminLesson>(`/instructor/lessons/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
    restoreRevision: (id: string, revisionId: string) =>
      apiFetch<AdminLesson>(`/instructor/lessons/${id}/revisions/${revisionId}/restore`, {
        method: 'POST',
      }),
    submitReview: (id: string, notes?: string) =>
      apiFetch<AdminLesson>(`/instructor/lessons/${id}/submit-review`, {
        method: 'POST',
        body: JSON.stringify(notes ? { notes } : {}),
        headers: { 'content-type': 'application/json' },
      }),
    getQuiz: (lessonId: string) => apiFetch<AdminQuiz | null>(`/instructor/lessons/${lessonId}/quiz`, { method: 'GET' }),
    upsertQuiz: (lessonId: string, input: any) =>
      apiFetch<AdminQuiz>(`/instructor/lessons/${lessonId}/quiz`, {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
    createQuestion: (quizId: string, input: any) =>
      apiFetch<any>(`/instructor/quizzes/${quizId}/questions`, {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
  },
};

export const aiInstructorApi = {
  generateOutline: (body: { topic: string; level: string; durationMinutes: number }) =>
    apiFetch<any>('/ai/instructor/generate-outline', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
  generateQuiz: (body: { lessonContent: string; questionCount: number }) =>
    apiFetch<any>('/ai/instructor/generate-quiz', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
  improveText: (body: { text: string; instruction: string }) =>
    apiFetch<any>('/ai/instructor/improve-text', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
};

export const adminApi = {
  analytics: () => apiFetch<any>('/admin/analytics', { method: 'GET' }),
  overview: () => apiFetch<AdminOverview>('/admin/overview', { method: 'GET' }),
  contentStats: () => apiFetch<AdminContentStats>('/admin/content/stats', { method: 'GET' }),
  reviews: (
    status: 'pending' | 'submitted' | 'changes_requested' | 'approved' | 'draft' | 'all' = 'pending',
    type: 'all' | 'course' | 'module' | 'lesson' = 'all',
  ) => {
    const query = new URLSearchParams({ status, type });
    return apiFetch<AdminReviewQueueResponse>(`/admin/reviews?${query.toString()}`, {
      method: 'GET',
    });
  },
  users: (page = 1, pageSize = 20, role: 'all' | UserRoleType = 'all') => {
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      role,
    });
    return apiFetch<AdminUserList>(`/admin/users?${query.toString()}`, { method: 'GET' });
  },

  skills: {
    list: () => apiFetch<AdminSkill[]>('/admin/skills', { method: 'GET' }),
    create: (input: { title: string; slug: string; description?: string; status?: string; order?: number }) =>
      apiFetch<AdminSkill>('/admin/skills', {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
    update: (id: string, input: Partial<{ title: string; slug: string; description?: string; status?: string; order?: number }>) =>
      apiFetch<AdminSkill>(`/admin/skills/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
    remove: (id: string) => apiFetch<AdminSkill>(`/admin/skills/${id}`, { method: 'DELETE' }),
  },

  instructors: {
    list: () => apiFetch<AdminInstructor[]>('/admin/instructors', { method: 'GET' }),
    create: (input: any) =>
      apiFetch<AdminInstructor>('/admin/instructors', {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
    update: (id: string, input: any) =>
      apiFetch<AdminInstructor>(`/admin/instructors/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
    remove: (id: string) => apiFetch<AdminInstructor>(`/admin/instructors/${id}`, { method: 'DELETE' }),
  },

  mediaAssets: {
    list: () => apiFetch<AdminMediaAsset[]>('/admin/media-assets', { method: 'GET' }),
    create: (input: any) =>
      apiFetch<AdminMediaAsset>('/admin/media-assets', {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
    upload: (input: { file: File; title?: string; altText?: string; status?: string }) => {
      const form = new FormData();
      form.append('file', input.file);
      if (input.title) form.append('title', input.title);
      if (input.altText) form.append('altText', input.altText);
      if (input.status) form.append('status', input.status);
      return apiFetch<AdminMediaAsset>('/admin/media-assets/upload', {
        method: 'POST',
        body: form,
      });
    },
    update: (id: string, input: any) =>
      apiFetch<AdminMediaAsset>(`/admin/media-assets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
    remove: (id: string) => apiFetch<AdminMediaAsset>(`/admin/media-assets/${id}`, { method: 'DELETE' }),
  },

  courses: {
    list: () => apiFetch<AdminCourseListItem[]>('/admin/courses', { method: 'GET' }),
    get: (id: string) => apiFetch<CourseDetail>(`/admin/courses/${id}`, { method: 'GET' }),
    create: (input: any) =>
      apiFetch<CourseDetail>('/admin/courses', {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
    update: (id: string, input: any) =>
      apiFetch<CourseDetail>(`/admin/courses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
    restoreRevision: (id: string, revisionId: string) =>
      apiFetch<CourseDetail>(`/admin/courses/${id}/revisions/${revisionId}/restore`, {
        method: 'POST',
      }),
    approveReview: (id: string, notes?: string) =>
      apiFetch<CourseDetail>(`/admin/courses/${id}/review/approve`, {
        method: 'POST',
        body: JSON.stringify(notes ? { notes } : {}),
        headers: { 'content-type': 'application/json' },
      }),
    requestChanges: (id: string, notes?: string) =>
      apiFetch<CourseDetail>(`/admin/courses/${id}/review/request-changes`, {
        method: 'POST',
        body: JSON.stringify(notes ? { notes } : {}),
        headers: { 'content-type': 'application/json' },
      }),
    remove: (id: string) => apiFetch<CourseDetail>(`/admin/courses/${id}`, { method: 'DELETE' }),
    modules: (courseId: string) => apiFetch<AdminModule[]>(`/admin/courses/${courseId}/modules`, { method: 'GET' }),
    createModule: (courseId: string, input: any) =>
      apiFetch<AdminModule>(`/admin/courses/${courseId}/modules`, {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
  },

  modules: {
    get: (id: string) => apiFetch<AdminModule>(`/admin/modules/${id}`, { method: 'GET' }),
    update: (id: string, input: any) =>
      apiFetch<AdminModule>(`/admin/modules/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
    restoreRevision: (id: string, revisionId: string) =>
      apiFetch<AdminModule>(`/admin/modules/${id}/revisions/${revisionId}/restore`, {
        method: 'POST',
      }),
    approveReview: (id: string, notes?: string) =>
      apiFetch<AdminModule>(`/admin/modules/${id}/review/approve`, {
        method: 'POST',
        body: JSON.stringify(notes ? { notes } : {}),
        headers: { 'content-type': 'application/json' },
      }),
    requestChanges: (id: string, notes?: string) =>
      apiFetch<AdminModule>(`/admin/modules/${id}/review/request-changes`, {
        method: 'POST',
        body: JSON.stringify(notes ? { notes } : {}),
        headers: { 'content-type': 'application/json' },
      }),
    remove: (id: string) => apiFetch<AdminModule>(`/admin/modules/${id}`, { method: 'DELETE' }),
    lessons: (moduleId: string) => apiFetch<AdminLesson[]>(`/admin/modules/${moduleId}/lessons`, { method: 'GET' }),
    createLesson: (moduleId: string, input: any) =>
      apiFetch<AdminLesson>(`/admin/modules/${moduleId}/lessons`, {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
  },

  lessons: {
    get: (id: string) => apiFetch<AdminLesson>(`/admin/lessons/${id}`, { method: 'GET' }),
    update: (id: string, input: any) =>
      apiFetch<AdminLesson>(`/admin/lessons/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
    restoreRevision: (id: string, revisionId: string) =>
      apiFetch<AdminLesson>(`/admin/lessons/${id}/revisions/${revisionId}/restore`, {
        method: 'POST',
      }),
    approveReview: (id: string, notes?: string) =>
      apiFetch<AdminLesson>(`/admin/lessons/${id}/review/approve`, {
        method: 'POST',
        body: JSON.stringify(notes ? { notes } : {}),
        headers: { 'content-type': 'application/json' },
      }),
    requestChanges: (id: string, notes?: string) =>
      apiFetch<AdminLesson>(`/admin/lessons/${id}/review/request-changes`, {
        method: 'POST',
        body: JSON.stringify(notes ? { notes } : {}),
        headers: { 'content-type': 'application/json' },
      }),
    remove: (id: string) => apiFetch<AdminLesson>(`/admin/lessons/${id}`, { method: 'DELETE' }),
    getQuiz: (lessonId: string) => apiFetch<AdminQuiz | null>(`/admin/lessons/${lessonId}/quiz`, { method: 'GET' }),
    upsertQuiz: (lessonId: string, input: any) =>
      apiFetch<AdminQuiz>(`/admin/lessons/${lessonId}/quiz`, {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
  },

  quizzes: {
    get: (id: string) => apiFetch<AdminQuiz>(`/admin/quizzes/${id}`, { method: 'GET' }),
    update: (id: string, input: any) =>
      apiFetch<AdminQuiz>(`/admin/quizzes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
    restoreRevision: (id: string, revisionId: string) =>
      apiFetch<AdminQuiz>(`/admin/quizzes/${id}/revisions/${revisionId}/restore`, {
        method: 'POST',
      }),
    remove: (id: string) => apiFetch<AdminQuiz>(`/admin/quizzes/${id}`, { method: 'DELETE' }),
    createQuestion: (quizId: string, input: any) =>
      apiFetch<any>(`/admin/quizzes/${quizId}/questions`, {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
  },

  questions: {
    update: (id: string, input: any) =>
      apiFetch<any>(`/admin/questions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: { 'content-type': 'application/json' },
      }),
    remove: (id: string) => apiFetch<any>(`/admin/questions/${id}`, { method: 'DELETE' }),
  },
};

export const codeExecutionApi = {
  execute: (input: { language: string; code: string; testCases?: any[] }) =>
    apiFetch<{
      stdout: string;
      stderr: string;
      executionTimeMs: number;
      passed: boolean;
      testResults: any[];
      previewHtml?: string;
    }>('/code/execute', {
      method: 'POST',
      body: JSON.stringify(input),
      headers: { 'content-type': 'application/json' },
    }),
  challenges: () => apiFetch<any[]>('/code/challenges', { method: 'GET' }),
  submitChallenge: (id: string, code: string, language = 'javascript') =>
    apiFetch<any>(`/code/challenges/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ code, language }),
      headers: { 'content-type': 'application/json' },
    }),
};

export const authSessionsApi = {
  list: () => apiFetch<{ sessions: any[] }>('/auth/sessions', { method: 'GET' }),
  revoke: () => apiFetch<{ ok: boolean; message: string }>('/auth/sessions', { method: 'DELETE' }),
};

export const adminExportApi = {
  usersCsvUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3200'}/admin/export/users/csv`,
  coursesCsvUrl: `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3200'}/admin/export/courses/csv`,
};

