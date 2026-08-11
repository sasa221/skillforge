'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowRight, Eye, EyeOff, Lock } from 'lucide-react';

import { AuthInputField, AuthScaffold } from '@/components/auth/AuthScaffold';
import { authApi } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import { resolveWorkspaceRedirect } from '@/lib/auth/workspaces';

const schema = z
  .object({
    token: z.string().min(10, 'Reset token is required'),
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
  const next = search.get('next');
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
      setSession(response.accessToken, response.user);
      setSuccessMessage('Password reset successful. Redirecting to login...');
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not reset password');
    }
  });

  if (!tokenFromQuery) {
    return (
      <AuthScaffold
        title="Invalid Link"
        subtitle="The password reset link is invalid or has expired."
        footer={
          <span>
            Need a new link?{' '}
            <Link className="font-semibold text-primary transition hover:text-primary/80" href="/forgot-password">
              Request password reset
            </Link>
          </span>
        }
      >
        <div className="rounded-[1.1rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
          Invalid reset link
        </div>
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold
      title="Choose a new password"
      subtitle="Enter a strong new password for your account."
      footer={
        <span>
          Need a new link?{' '}
          <Link className="font-semibold text-primary transition hover:text-primary/80" href="/forgot-password">
            Request password reset
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <input type="hidden" {...form.register('token')} />

        <div className="space-y-3">
          <label htmlFor="newPassword" className="text-base font-medium text-[var(--site-text)]">
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
            <p className="text-sm text-[var(--site-danger)]">{form.formState.errors.newPassword.message}</p>
          ) : null}
        </div>

        <div className="space-y-3">
          <label htmlFor="confirmPassword" className="text-base font-medium text-[var(--site-text)]">
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
            <p className="text-sm text-[var(--site-danger)]">{form.formState.errors.confirmPassword.message}</p>
          ) : null}
        </div>

        {formError ? (
          <div className="rounded-[1.1rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
            {formError}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-[1.1rem] border border-[var(--site-success)]/20 bg-[var(--site-success-soft)] px-4 py-3 text-sm text-[var(--site-success)]">
            {successMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="inline-flex h-16 w-full items-center justify-center gap-3 rounded-[1.2rem] bg-[var(--site-primary)] text-xl font-semibold text-white shadow-[0_18px_34px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)] disabled:opacity-70"
        >
          {form.formState.isSubmitting ? 'Updating password...' : 'Update password'}
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>
    </AuthScaffold>
  );
}
