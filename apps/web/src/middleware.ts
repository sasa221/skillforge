import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPrefixes = ['/dashboard', '/admin', '/instructor', '/workspace'];
const adminRoles = new Set(['admin', 'content_manager', 'super_admin']);
const instructorRoles = new Set(['instructor', 'admin', 'content_manager', 'super_admin']);
const SESSION_COOKIE = 'sf_session';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3200';
type SessionPayload = {
  sub?: string;
  email?: string;
  roles?: string[];
  isEmailVerified?: boolean;
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) return NextResponse.next();

  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  const session = sessionToken ? await fetchSession(sessionToken) : null;
  if (!session?.sub) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const roles = session.roles ?? [];
  if (!session.isEmailVerified) {
    const verifyUrl = new URL('/verify-email', req.url);
    if (session.email) verifyUrl.searchParams.set('email', session.email);
    verifyUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(verifyUrl);
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!roles.some((role) => adminRoles.has(role))) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  if (pathname === '/instructor' || pathname.startsWith('/instructor/')) {
    if (!roles.some((role) => instructorRoles.has(role))) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/instructor/:path*', '/workspace/:path*'],
};

async function fetchSession(token: string): Promise<SessionPayload | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/session`, {
      method: 'GET',
      headers: {
        cookie: `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    const json = (await res.json()) as { ok?: boolean; session?: SessionPayload | null };
    if (!json.ok || !json.session) return null;
    return json.session;
  } catch {
    return null;
  }
}

