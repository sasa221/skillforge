'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from 'lucide-react';

import {
  AuthDivider,
  AuthInputField,
  AuthScaffold,
  AuthSecondaryButton,
} from '@/components/auth/AuthScaffold';
import { authApi } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import { resolveWorkspaceRedirect } from '@/lib/auth/workspaces';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <AuthScaffold
          title="Welcome Back"
          subtitle="Please enter your details to sign in."
          footer={<span>Loading...</span>}
        >
          <div className="rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 text-sm text-[var(--site-muted)]">
            Preparing your sign in experience...
          </div>
        </AuthScaffold>
      }
    >
      <LoginClient />
    </React.Suspense>
  );
}

function LoginClient() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next');
  const flash = search.get('flash');
  const setSession = useAuthStore((s) => s.setSession);

  const [formError, setFormError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [keepSignedIn, setKeepSignedIn] = React.useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const res = await authApi.login(values);
      setSession(res.accessToken, res.user);
      const workspaceHref = resolveWorkspaceRedirect(res.user, next);
      if (!res.user.isEmailVerified) {
        router.replace(
          `/verify-email?email=${encodeURIComponent(res.user.email)}&next=${encodeURIComponent(workspaceHref)}`,
        );
        return;
      }
      router.replace(workspaceHref);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Login failed');
    }
  });

  return (
    <AuthScaffold
      title="Welcome Back"
      subtitle="Please enter your details to sign in."
      footer={
        <span>
          Don&apos;t have an account?{' '}
          <Link className="font-semibold text-primary transition hover:text-primary/80" href="/signup">
            Start learning for free
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {flash === 'password-reset' || flash === 'email-verified' ? (
          <div className="rounded-[1.1rem] border border-[var(--site-success)]/20 bg-[var(--site-success-soft)] px-4 py-3 text-sm text-[var(--site-success)]">
            {flash === 'password-reset'
              ? 'Your password was updated. Sign in with the new password.'
              : 'Your email is verified. You can sign in normally now.'}
          </div>
        ) : null}

        <div className="space-y-3">
          <label htmlFor="email" className="text-base font-medium text-[var(--site-text)]">
            Email Address
          </label>
          <AuthInputField
            id="email"
            type="email"
            autoComplete="email"
            icon={Mail}
            placeholder="name@company.com"
            {...form.register('email')}
          />
          {form.formState.errors.email?.message ? (
            <p className="text-sm text-[var(--site-danger)]">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="password" className="text-base font-medium text-[var(--site-text)]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-primary transition hover:text-primary/80"
            >
              Forgot?
            </Link>
          </div>
          <AuthInputField
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            icon={Lock}
            placeholder="........"
            rightAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="text-[var(--site-subtle)] transition hover:text-[var(--site-text)]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            }
            {...form.register('password')}
          />
          {form.formState.errors.password?.message ? (
            <p className="text-sm text-[var(--site-danger)]">{form.formState.errors.password.message}</p>
          ) : null}
        </div>

        <label className="flex items-center gap-3 text-base text-[var(--site-muted)]">
          <input
            type="checkbox"
            checked={keepSignedIn}
            onChange={(event) => setKeepSignedIn(event.target.checked)}
            className="h-5 w-5 rounded border border-[var(--site-border-strong)] bg-transparent accent-[var(--site-primary)]"
          />
          <span>Keep me signed in</span>
        </label>

        {formError ? (
          <div className="rounded-[1.1rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
            {formError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="inline-flex h-16 w-full items-center justify-center gap-3 rounded-[1.2rem] bg-[var(--site-primary)] text-xl font-semibold text-white shadow-[0_18px_34px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)] disabled:opacity-70"
        >
          {form.formState.isSubmitting ? 'Signing In...' : 'Sign In'}
          <ArrowRight className="h-5 w-5" />
        </button>

        <AuthDivider label="or continue with" />

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthSecondaryButton>Google</AuthSecondaryButton>
          <AuthSecondaryButton>LinkedIn</AuthSecondaryButton>
        </div>
      </form>
    </AuthScaffold>
  );
}
