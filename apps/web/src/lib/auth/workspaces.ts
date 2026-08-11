import type { MeUser, UserRoleType } from './types';

const adminRoles = new Set<UserRoleType>(['admin', 'content_manager', 'super_admin']);
const instructorRoles = new Set<UserRoleType>([
  'instructor',
  'admin',
  'content_manager',
  'super_admin',
]);

export type WorkspaceKey = 'learner' | 'instructor' | 'admin';

export type WorkspaceOption = {
  key: WorkspaceKey;
  href: string;
  label: string;
  description: string;
};

export function getAvailableWorkspaces(
  user: MeUser | null | undefined,
): WorkspaceOption[] {
  if (!user) return [];

  const roles = user.roles ?? [];
  const workspaces: WorkspaceOption[] = [
    {
      key: 'learner',
      href: '/dashboard',
      label: 'Learner',
      description: 'Courses, lessons, achievements, and your day-to-day progress.',
    },
  ];

  if (roles.some((role) => instructorRoles.has(role))) {
    workspaces.push({
      key: 'instructor',
      href: '/instructor',
      label: 'Instructor',
      description: 'Assigned courses, teaching content, revisions, and review-ready updates.',
    });
  }

  if (roles.some((role) => adminRoles.has(role))) {
    workspaces.push({
      key: 'admin',
      href: '/admin',
      label: 'Admin',
      description: 'Platform controls, users, instructors, media, and publishing review.',
    });
  }

  return workspaces;
}

export function resolveWorkspaceRedirect(
  user: MeUser | null | undefined,
  next?: string | null,
) {
  if (next && next.startsWith('/')) {
    return next;
  }

  const workspaces = getAvailableWorkspaces(user);
  if (workspaces.length > 1) {
    return '/workspace';
  }

  return workspaces[0]?.href ?? '/dashboard';
}
