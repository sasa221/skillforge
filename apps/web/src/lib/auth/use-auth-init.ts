'use client';

import * as React from 'react';

import { useAuthStore } from '@/lib/auth/store';
import { env } from '@/lib/env';
import type { AuthTokenResponse } from '@/lib/auth/types';

export function useAuthInit() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const initTried = useAuthStore((s) => s.initTried);
  const markInitTried = useAuthStore((s) => s.markInitTried);
  const setSession = useAuthStore((s) => s.setSession);

  React.useEffect(() => {
    if (accessToken || initTried) return;

    let cancelled = false;
    (async () => {
      try {
        // This will 401 if no refresh cookie; apiFetch will attempt refresh automatically on 401 only
        // when calling protected endpoints. Here we explicitly call /auth/refresh first.
        const res = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return;
        const json = (await res.json()) as AuthTokenResponse;
        if (cancelled) return;
        setSession(json.accessToken, json.user);
      } catch {
        // ignore
      } finally {
        if (!cancelled) markInitTried();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, initTried, markInitTried, setSession]);

  return { accessToken, initTried };
}

