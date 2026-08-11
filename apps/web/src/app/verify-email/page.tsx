'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowRight, BadgeCheck, Mail } from 'lucide-react';

import { AuthInputField, AuthScaffold } from '@/components/auth/AuthScaffold';
import { authApi } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import { resolveWorkspaceRedirect } from '@/lib/auth/workspaces';

const schema = z.object({
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={null}>
      <VerifyEmailClient />
    </React.Suspense>
  );
}

function VerifyEmailClient() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get('token');
  const next = search.get('next');
  const sessionUser = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.setSession);

  const [formError, setFormError] = React.useState<string | null>(null);
  const [requestState, setRequestState] = React.useState<{
    message: string;
    debugUrl?: string;
  } | null>(null);
  const [verificationState, setVerificationState] = React.useState<
    'idle' | 'verifying' | 'verified' | 'failed'
  >(token ? 'verifying' : sessionUser?.isEmailVerified ? 'verified' : 'idle');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: search.get('email') ?? sessionUser?.email ?? '',
    },
  });

  const continueHref = resolveWorkspaceRedirect(sessionUser, next);

  React.useEffect(() => {
    let cancelled = false;
    if (!token) return;

    (async () => {
      try {
        await authApi.confirmEmailVerification({ token });
        if (cancelled) return;
        if (accessToken) {
          const refreshedUser = await authApi.me();
          if (!cancelled) {
            setSession(accessToken, refreshedUser);
          }
        }
        setVerificationState('verified');
      } catch (error) {
        if (!cancelled) {
          setFormError(error instanceof Error ? error.message : 'Could not verify email');
          setVerificationState('failed');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, setSession, token]);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const response = await authApi.requestEmailVerification(values);
      setRequestState({
        message: response.message,
        debugUrl: response.debugUrl,
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not send verification email');
    }
  });

  if (verificationState === 'verifying') {
    return (
      <AuthScaffold
        title="Verifying your email"
        subtitle="We are confirming your email address and updating your account."
        footer={<span>Please wait a moment…</span>}
      >
        <div className="rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 text-sm text-[var(--site-muted)]">
          Checking your secure verification link...
        </div>
      </AuthScaffold>
    );
  }

  if (verificationState === 'verified' || sessionUser?.isEmailVerified) {
    return (
      <AuthScaffold
        title="Email verified"
        subtitle="Your account is confirmed and ready to keep moving."
        footer={
          <span>
            Need anything else?{' '}
            <Link className="font-semibold text-primary transition hover:text-primary/80" href="/dashboard/profile">
              Open your profile
            </Link>
          </span>
        }
      >
        <div className="space-y-6">
          <div className="rounded-[1.2rem] border border-[var(--site-success)]/20 bg-[var(--site-success-soft)] p-5 text-sm text-[var(--site-success)]">
            <div className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5 h-5 w-5" />
              <div>
                <div className="font-semibold">Your email is confirmed.</div>
                <div className="mt-2">
                  You can continue with your learning workspace without any verification warnings.
                </div>
              </div>
            </div>
          </div>

          <Link
            href={continueHref}
            className="inline-flex h-16 w-full items-center justify-center gap-3 rounded-[1.2rem] bg-[var(--site-primary)] text-xl font-semibold text-white shadow-[0_18px_34px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)]"
          >
            Continue to your workspace
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold
      title="Verify your email"
      subtitle="Send a secure verification link to your inbox. In local development, the direct link appears here right away."
      footer={
        <span>
          Already verified?{' '}
          <Link className="font-semibold text-primary transition hover:text-primary/80" href="/login?flash=email-verified">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-3">
          <label htmlFor="email" className="text-base font-medium text-[var(--site-text)]">
            Email Address
          </label>
          <AuthInputField
            id="email"
            type="email"
            autoComplete="email"
            icon={Mail}
            placeholder="name@example.com"
            {...form.register('email')}
          />
          {form.formState.errors.email?.message ? (
            <p className="text-sm text-[var(--site-danger)]">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        {formError ? (
          <div className="rounded-[1.1rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
            {formError}
          </div>
        ) : null}

        {requestState ? (
          <div className="space-y-3 rounded-[1.2rem] border border-[var(--site-success)]/20 bg-[var(--site-success-soft)] p-4 text-sm text-[var(--site-success)]">
            <p>{requestState.message}</p>
            {requestState.debugUrl ? (
              <Link
                href={requestState.debugUrl}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--site-success)]/20 bg-white px-4 py-2 font-semibold text-[var(--site-success)] transition hover:bg-[var(--site-success-soft)]"
              >
                Open verification link
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="inline-flex h-16 w-full items-center justify-center gap-3 rounded-[1.2rem] bg-[var(--site-primary)] text-xl font-semibold text-white shadow-[0_18px_34px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)] disabled:opacity-70"
        >
          {form.formState.isSubmitting ? 'Sending verification link...' : 'Send verification link'}
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>
    </AuthScaffold>
  );
}
