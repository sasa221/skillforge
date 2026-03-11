import { create } from 'zustand';

import type { MeUser } from './types';

function setCookie(name: string, value: string, days = 30) {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

type AuthState = {
  accessToken: string | null;
  user: MeUser | null;
  initTried: boolean;

  setSession: (accessToken: string, user: MeUser) => void;
  clearSession: () => void;
  markInitTried: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  initTried: false,

  setSession: (accessToken, user) => {
    setCookie('sf_auth', '1');
    const isAdmin = user.roles.some((r) => r === 'admin' || r === 'content_manager' || r === 'super_admin');
    setCookie('sf_admin', isAdmin ? '1' : '0');
    set({ accessToken, user });
  },
  clearSession: () => {
    clearCookie('sf_auth');
    clearCookie('sf_admin');
    set({ accessToken: null, user: null });
  },
  markInitTried: () => set({ initTried: true }),
}));

