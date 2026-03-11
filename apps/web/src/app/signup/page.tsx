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
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  interests: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
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
      <SignupClient />
    </React.Suspense>
  );
}

function SignupClient() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/dashboard';
  const setSession = useAuthStore((s) => s.setSession);

  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '', interests: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const interests =
        values.interests
          ?.split(',')
          .map((s) => s.trim())
          .filter(Boolean) ?? [];
      const res = await authApi.signup({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        interests,
      });
      setSession(res.accessToken, res.user);
      router.replace(next);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Signup failed');
    }
  });

  return (
    <main className="container flex min-h-[calc(100vh-2rem)] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create an account and pick a couple interests to personalize your learning path.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" autoComplete="name" {...form.register('fullName')} />
            {form.formState.errors.fullName?.message ? (
              <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
            ) : null}
          </div>

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
              autoComplete="new-password"
              {...form.register('password')}
            />
            {form.formState.errors.password?.message ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="interests">Interests (comma-separated)</Label>
            <Input id="interests" placeholder="sql, excel, python" {...form.register('interests')} />
            <p className="text-xs text-muted-foreground">
              Example: <span className="font-mono">sql, excel</span>
            </p>
          </div>

          {formError ? <div className="rounded-md border bg-muted p-3 text-sm">{formError}</div> : null}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>

          <div className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link className="text-foreground underline" href="/login">
              Login
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

