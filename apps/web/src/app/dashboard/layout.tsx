'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/lib/auth/store';
import { useAuthInit } from '@/lib/auth/use-auth-init';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, initTried } = useAuthInit();
  const user = useAuthStore((state) => state.user);

  React.useEffect(() => {
    if (!initTried) return;
    if (!accessToken || !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [accessToken, initTried, pathname, router, user]);

  if (!initTried && !accessToken) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm">
          <div className="text-sm text-muted-foreground">Loading session...</div>
        </div>
      </AppShell>
    );
  }

  if (!accessToken || !user) return null;

  return <AppShell>{children}</AppShell>;
}
