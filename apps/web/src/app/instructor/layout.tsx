'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { InstructorShell } from '@/components/instructor/InstructorShell';
import { useAuthInit } from '@/lib/auth/use-auth-init';
import { useAuthStore } from '@/lib/auth/store';

const instructorRoles = new Set(['instructor', 'admin', 'content_manager', 'super_admin']);

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, initTried } = useAuthInit();
  const user = useAuthStore((state) => state.user);

  React.useEffect(() => {
    if (!initTried) return;

    if (!accessToken || !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const canOpenInstructorWorkspace = user.roles.some((role) => instructorRoles.has(role));
    if (!canOpenInstructorWorkspace) {
      router.replace('/dashboard');
    }
  }, [accessToken, initTried, pathname, router, user]);

  if (!initTried && !accessToken) {
    return (
      <InstructorShell>
        <div className="rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_20px_50px_var(--site-shadow)]">
          <div className="text-sm text-[var(--site-muted)]">Loading instructor session...</div>
        </div>
      </InstructorShell>
    );
  }

  if (!accessToken || !user) return null;
  if (!user.roles.some((role) => instructorRoles.has(role))) return null;

  return <InstructorShell>{children}</InstructorShell>;
}
