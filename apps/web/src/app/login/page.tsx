'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <main className="container flex min-h-[calc(100vh-2rem)] items-center justify-center py-10">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
            <div className="text-sm text-muted-foreground">Loading…</div>
          </div>
        </main>
      }
    >
      <LoginClient />
    </React.Suspense>
  );
}

function LoginClient() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/dashboard';
  const setSession = useAuthStore((s) => s.setSession);

  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const res = await authApi.login(values);
      setSession(res.accessToken, res.user);
      router.replace(next);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Login failed');
    }
  });

  return (
    <main className="container flex min-h-[calc(100vh-2rem)] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use your email and password.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
            {form.formState.errors.email?.message ? (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...form.register('password')}
            />
            {form.formState.errors.password?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          {formError ? <div className="rounded-md border bg-muted p-3 text-sm">{formError}</div> : null}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>

          <div className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link className="text-foreground underline" href="/signup">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

