'use client';

import * as React from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowRight, Mail } from 'lucide-react';

import { AuthInputField, AuthScaffold } from '@/components/auth/AuthScaffold';
import { authApi } from '@/lib/api/client';

const schema = z.object({
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [requestState, setRequestState] = React.useState<{
    message: string;
    debugUrl?: string;
  } | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const response = await authApi.requestPasswordReset(values);
      setRequestState({
        message: response.message,
        debugUrl: response.debugUrl,
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not start password reset');
    }
  });

  return (
    <AuthScaffold
      title="Reset your password"
      subtitle="We will send the next step to your email. In local development, the secure reset link appears here immediately."
      footer={
        <span>
          Remembered your password?{' '}
          <Link className="font-semibold text-primary transition hover:text-primary/80" href="/login">
            Back to login
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
                Open reset link
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
          {form.formState.isSubmitting ? 'Sending reset link...' : 'Send reset link'}
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>
    </AuthScaffold>
  );
}
