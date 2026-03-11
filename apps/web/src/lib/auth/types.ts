export type UserRoleType = 'student' | 'admin' | 'content_manager' | 'super_admin';

export type MeProfile = {
  fullName: string;
  avatarUrl: string | null;
  interests: string[];
  xp: number;
  level: number;
};

export type MeUser = {
  id: string;
  email: string;
  roles: UserRoleType[];
  profile: MeProfile | null;
};

export type AuthTokenResponse = {
  accessToken: string;
  user: MeUser;
};

