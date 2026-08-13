'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowRight, BadgeCheck, KeyRound, Mail, ShieldCheck } from 'lucide-react';

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
  const tokenFromUrl = search.get('token') ?? '';
  const next = search.get('next');
  const sessionUser = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.setSession);

  const [otpInput, setOtpInput] = React.useState(tokenFromUrl);
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [requestState, setRequestState] = React.useState<{
    message: string;
    debugUrl?: string;
  } | null>(null);
  const [verificationState, setVerificationState] = React.useState<
    'idle' | 'verifying' | 'verified' | 'failed'
  >(tokenFromUrl ? 'verifying' : sessionUser?.isEmailVerified ? 'verified' : 'idle');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: search.get('email') ?? sessionUser?.email ?? '',
    },
  });

  const continueHref = resolveWorkspaceRedirect(sessionUser, next);

  const handleVerifyToken = React.useCallback(
    async (codeToVerify: string) => {
      setFormError(null);
      setIsVerifyingOtp(true);
      try {
        await authApi.confirmEmailVerification({ token: codeToVerify.trim() });
        if (accessToken) {
          const refreshedUser = await authApi.me();
          setSession(accessToken, refreshedUser);
        }
        setVerificationState('verified');
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Invalid or expired 6-digit OTP code');
        setVerificationState('failed');
      } finally {
        setIsVerifyingOtp(false);
      }
    },
    [accessToken, setSession],
  );

  React.useEffect(() => {
    if (tokenFromUrl) {
      void handleVerifyToken(tokenFromUrl);
    }
  }, [handleVerifyToken, tokenFromUrl]);

  const onSubmitRequestEmail = form.handleSubmit(async (values) => {
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

  if (verificationState === 'verified' || sessionUser?.isEmailVerified) {
    return (
      <AuthScaffold
        title="Email Verified"
        subtitle="Your SkillForge account is fully confirmed."
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
          <div className="rounded-[1.2rem] border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm text-emerald-400">
            <div className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5 h-6 w-6 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-base text-[var(--site-text)]">Account Verified Successfully!</div>
                <div className="mt-1 text-xs text-[var(--site-muted)]">
                  You now have unrestricted access to all SkillForge courses, AI tutoring, and certificates.
                </div>
              </div>
            </div>
          </div>

          <Link
            href={continueHref}
            className="inline-flex h-16 w-full items-center justify-center gap-3 rounded-[1.2rem] bg-[var(--site-primary)] text-lg font-semibold text-white shadow-[0_18px_34px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)]"
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
      title="Verify Your Email"
      subtitle="Enter the 6-digit OTP code sent to your email to verify your SkillForge account."
      footer={
        <span>
          Already verified?{' '}
          <Link className="font-semibold text-primary transition hover:text-primary/80" href="/login?flash=email-verified">
            Sign in
          </Link>
        </span>
      }
    >
      <div className="space-y-8">
        {/* 6-Digit OTP Direct Input Box */}
        <div className="rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--site-text)]">Enter 6-Digit OTP Code</h3>
              <p className="text-xs text-[var(--site-muted)]">Check your inbox for the code</p>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 582914"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.trim())}
              className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-bg)] p-4 text-center font-mono text-2xl font-extrabold tracking-[10px] text-[var(--site-text)] focus:border-indigo-500 focus:outline-none"
            />

            <button
              type="button"
              disabled={isVerifyingOtp || otpInput.length < 6}
              onClick={() => handleVerifyToken(otpInput)}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-md transition hover:bg-indigo-500 disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              {isVerifyingOtp ? 'Verifying OTP Code...' : 'Confirm OTP Code'}
            </button>
          </div>
        </div>

        {/* Resend OTP Form */}
        <div className="border-t border-[var(--site-border)] pt-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--site-muted)]">
            Didn't receive an OTP code?
          </h4>

          <form onSubmit={onSubmitRequestEmail} className="space-y-4">
            <AuthInputField
              id="email"
              type="email"
              autoComplete="email"
              icon={Mail}
              placeholder="Enter your email to resend OTP"
              {...form.register('email')}
            />

            {formError ? (
              <div className="rounded-[1.1rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-xs text-[var(--site-danger)]">
                {formError}
              </div>
            ) : null}

            {requestState ? (
              <div className="rounded-[1.2rem] border border-[var(--site-success)]/20 bg-[var(--site-success-soft)] p-4 text-xs text-[var(--site-success)]">
                <p>{requestState.message}</p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] text-xs font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-hover)] disabled:opacity-70"
            >
              {form.formState.isSubmitting ? 'Sending new OTP...' : 'Send new 6-Digit OTP Code'}
            </button>
          </form>
        </div>
      </div>
    </AuthScaffold>
  );
}
