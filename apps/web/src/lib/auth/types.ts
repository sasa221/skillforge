export type UserRoleType =
  | 'student'
  | 'instructor'
  | 'admin'
  | 'content_manager'
  | 'super_admin';

export type MeProfile = {
  fullName: string;
  avatarUrl: string | null;
  interests: string[];
  xp: number;
  level: number;
};

export type MeInstructorProfile = {
  id: string;
  slug: string;
  fullName: string;
  title: string | null;
  status: 'draft' | 'published' | 'archived';
  avatarUrl: string | null;
};

export type MeUser = {
  id: string;
  email: string;
  isEmailVerified: boolean;
  emailVerifiedAt: string | null;
  roles: UserRoleType[];
  profile: MeProfile | null;
  instructorProfile?: MeInstructorProfile | null;
};

export type AuthTokenResponse = {
  accessToken: string;
  user: MeUser;
};

export type AuthActionResponse = {
  ok: true;
  message: string;
  debugToken?: string;
  debugUrl?: string;
};

