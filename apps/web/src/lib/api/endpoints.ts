import type { MeUser } from '@/lib/auth/types';
import type { Profile } from '@/lib/profile/types';
import { apiFetch } from '@/lib/api/client';
import type {
  Course,
  CourseDetail,
  CourseProgress,
  DashboardProgress,
  Enrollment,
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
  AdminLesson,
  AdminModule,
  AdminOverview,
  AdminQuiz,
  AdminSkill,
  AdminUserList,
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
  list: () => apiFetch<Course[]>('/courses', { method: 'GET', auth: false }),
  bySlug: (slug: string) => apiFetch<CourseDetail>(`/courses/${slug}`, { method: 'GET', auth: false }),
};

export const lessonsApi = {
  bySlug: (slug: string) => apiFetch<LessonDetail>(`/lessons/${slug}`, { method: 'GET', auth: false }),
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
  explainAnswer: (input: { lessonId: string; questionId: string; selectedOptionId?: string }) =>
    apiFetch<AiExplainAnswerResponse>('/ai/explain-answer', {
      method: 'POST',
      body: JSON.stringify(input),
      headers: { 'content-type': 'application/json' },
    }),
};

export const eventsApi = {
  lessonOpened: (lessonId: string) =>
    apiFetch<{ ok: true }>('/events/lesson-opened', {
      method: 'POST',
      body: JSON.stringify({ lessonId }),
      headers: { 'content-type': 'application/json' },
    }),
};

export const adminApi = {
  overview: () => apiFetch<AdminOverview>('/admin/overview', { method: 'GET' }),
  contentStats: () => apiFetch<AdminContentStats>('/admin/content/stats', { method: 'GET' }),
  users: (page = 1, pageSize = 20) =>
    apiFetch<AdminUserList>(`/admin/users?page=${page}&pageSize=${pageSize}`, { method: 'GET' }),

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

