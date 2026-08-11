import { create } from 'zustand';

import type { MeUser } from './types';

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
    set({ accessToken, user });
  },
  clearSession: () => {
    clearCookie('sf_auth');
    clearCookie('sf_admin');
    clearCookie('sf_session');
    set({ accessToken: null, user: null });
  },
  markInitTried: () => set({ initTried: true }),
}));

