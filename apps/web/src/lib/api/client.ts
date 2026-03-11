import { env } from '@/lib/env';
import { useAuthStore } from '@/lib/auth/store';
import type { AuthTokenResponse, MeUser } from '@/lib/auth/types';

type ApiErrorPayload = { message?: string | string[] } | string;

async function parseError(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  if (!text) return res.statusText || `HTTP ${res.status}`;
  try {
    const json = JSON.parse(text) as ApiErrorPayload;
    if (typeof json === 'string') return json;
    const msg = (json as any).message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    return text;
  } catch {
    return text;
  }
}

async function rawFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
}

async function refreshAccessToken(): Promise<string | null> {
  const res = await rawFetch('/auth/refresh', { method: 'POST' });
  if (!res.ok) return null;
  const json = (await res.json()) as AuthTokenResponse;
  useAuthStore.getState().setSession(json.accessToken, json.user);
  return json.accessToken;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  const wantsAuth = init?.auth ?? true;

  const doFetch = async (token: string | null) => {
    const headers: Record<string, string> = {
      ...(init?.headers as any),
    };
    if (init?.body && !headers['content-type']) headers['content-type'] = 'application/json';
    if (wantsAuth && token) headers.authorization = `Bearer ${token}`;
    return rawFetch(path, { ...init, headers });
  };

  let res = await doFetch(accessToken);
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) res = await doFetch(newToken);
  }

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return (await res.json()) as T;
}

export const authApi = {
  signup: async (input: { email: string; password: string; fullName: string; interests?: string[] }) =>
    apiFetch<AuthTokenResponse>('/auth/signup', {
      method: 'POST',
      auth: false,
      body: JSON.stringify(input),
      headers: { 'content-type': 'application/json' },
    }),
  login: async (input: { email: string; password: string }) =>
    apiFetch<AuthTokenResponse>('/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify(input),
      headers: { 'content-type': 'application/json' },
    }),
  logout: async () =>
    apiFetch<{ ok: true }>('/auth/logout', {
      method: 'POST',
    }),
  me: async () => apiFetch<MeUser>('/auth/me', { method: 'GET' }),
};

export { refreshAccessToken };

