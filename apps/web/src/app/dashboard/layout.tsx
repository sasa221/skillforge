'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuthInit } from '@/lib/auth/use-auth-init';
import { useAuthStore } from '@/lib/auth/store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, initTried } = useAuthInit();
  const user = useAuthStore((s) => s.user);

  React.useEffect(() => {
    if (!initTried) return;
    if (!accessToken || !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [accessToken, initTried, pathname, router, user]);

  if (!initTried && !accessToken) {
    return (
      <main className="container py-10">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="text-sm text-muted-foreground">Loading session…</div>
        </div>
      </main>
    );
  }

  if (!accessToken || !user) return null;

  return <>{children}</>;
}

