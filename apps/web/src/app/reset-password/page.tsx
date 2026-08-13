'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, ShieldCheck } from 'lucide-react';

import { AuthInputField, AuthScaffold } from '@/components/auth/AuthScaffold';
import { authApi } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';

const schema = z
  .object({
    token: z.string().min(6, '6-digit OTP code is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={null}>
      <ResetPasswordClient />
    </React.Suspense>
  );
}

function ResetPasswordClient() {
  const router = useRouter();
  const search = useSearchParams();
  const tokenFromQuery = search.get('token') ?? '';
  const setSession = useAuthStore((state) => state.setSession);

  const [formError, setFormError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: tokenFromQuery,
      newPassword: '',
      confirmPassword: '',
    },
  });

  React.useEffect(() => {
    if (tokenFromQuery) {
      form.setValue('token', tokenFromQuery, { shouldDirty: false });
    }
  }, [form, tokenFromQuery]);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const response = await authApi.confirmPasswordReset(values);
      if (response.accessToken && response.user) {
        setSession(response.accessToken, response.user);
      }
      setSuccessMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Invalid or expired OTP code');
    }
  });

  return (
    <AuthScaffold
      title="Reset Your Password"
      subtitle="Enter the 6-digit OTP code sent to your email along with your new password."
      footer={
        <span>
          Need a new OTP code?{' '}
          <Link className="font-semibold text-primary transition hover:text-primary/80" href="/forgot-password">
            Request OTP
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {/* 6-Digit OTP Field */}
        <div className="space-y-3">
          <label htmlFor="token" className="text-sm font-bold text-[var(--site-text)] flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-indigo-500" />
            6-Digit Password Reset OTP Code
          </label>
          <AuthInputField
            id="token"
            type="text"
            icon={KeyRound}
            maxLength={6}
            placeholder="e.g. 582914"
            {...form.register('token')}
          />
          {form.formState.errors.token?.message ? (
            <p className="text-xs text-[var(--site-danger)]">{form.formState.errors.token.message}</p>
          ) : null}
        </div>

        {/* New Password Field */}
        <div className="space-y-3">
          <label htmlFor="newPassword" className="text-sm font-bold text-[var(--site-text)]">
            New Password
          </label>
          <AuthInputField
            id="newPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            icon={Lock}
            placeholder="Create a strong new password"
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
            {...form.register('newPassword')}
          />
          {form.formState.errors.newPassword?.message ? (
            <p className="text-xs text-[var(--site-danger)]">{form.formState.errors.newPassword.message}</p>
          ) : null}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-3">
          <label htmlFor="confirmPassword" className="text-sm font-bold text-[var(--site-text)]">
            Confirm Password
          </label>
          <AuthInputField
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            icon={Lock}
            placeholder="Confirm your new password"
            {...form.register('confirmPassword')}
          />
          {form.formState.errors.confirmPassword?.message ? (
            <p className="text-xs text-[var(--site-danger)]">{form.formState.errors.confirmPassword.message}</p>
          ) : null}
        </div>

        {formError ? (
          <div className="rounded-[1.1rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-xs text-[var(--site-danger)]">
            {formError}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-[1.1rem] border border-[var(--site-success)]/20 bg-[var(--site-success-soft)] px-4 py-3 text-xs text-[var(--site-success)]">
            {successMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="inline-flex h-16 w-full items-center justify-center gap-3 rounded-[1.2rem] bg-[var(--site-primary)] text-lg font-semibold text-white shadow-[0_18px_34px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)] disabled:opacity-70"
        >
          {form.formState.isSubmitting ? 'Updating Password...' : 'Verify OTP & Reset Password'}
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>
    </AuthScaffold>
  );
}
