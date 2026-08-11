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
  Plus,
  User,
  X,
} from 'lucide-react';

import { AuthInputField, AuthScaffold } from '@/components/auth/AuthScaffold';
import { authApi } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import { resolveWorkspaceRedirect } from '@/lib/auth/workspaces';
import { cn } from '@/lib/utils';

const suggestedInterests = [
  'Artificial Intelligence',
  'Data Science',
  'UI/UX Design',
  'Cloud Computing',
  'SQL',
  'Python',
  'Excel',
];

const schema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  interests: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  return (
    <React.Suspense
      fallback={
        <AuthScaffold
          title="Join SkillForge"
          subtitle="Fill in your details to get started."
          brandMode="inside"
          footer={<span>Loading...</span>}
        >
          <div className="rounded-[1.2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 text-sm text-[var(--site-muted)]">
            Preparing your sign up experience...
          </div>
        </AuthScaffold>
      }
    >
      <SignupClient />
    </React.Suspense>
  );
}

function SignupClient() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next');
  const setSession = useAuthStore((s) => s.setSession);

  const [formError, setFormError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [customInterest, setCustomInterest] = React.useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      interests: [],
    },
  });

  const selectedInterests = form.watch('interests') ?? [];

  const setInterests = React.useCallback(
    (interests: string[]) => {
      form.setValue('interests', interests, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  const toggleInterest = React.useCallback(
    (interest: string) => {
      const exists = selectedInterests.some(
        (value) => value.toLowerCase() === interest.toLowerCase(),
      );

      if (exists) {
        setInterests(
          selectedInterests.filter(
            (value) => value.toLowerCase() !== interest.toLowerCase(),
          ),
        );
        return;
      }

      setInterests([...selectedInterests, interest]);
    },
    [selectedInterests, setInterests],
  );

  const addCustomInterest = React.useCallback(() => {
    const value = customInterest.trim();
    if (!value) return;

    const exists = selectedInterests.some(
      (interest) => interest.toLowerCase() === value.toLowerCase(),
    );

    if (!exists) {
      setInterests([...selectedInterests, value]);
    }

    setCustomInterest('');
  }, [customInterest, selectedInterests, setInterests]);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const res = await authApi.signup(values);
      setSession(res.accessToken, res.user);
      const workspaceHref = resolveWorkspaceRedirect(res.user, next);
      router.replace(
        `/verify-email?email=${encodeURIComponent(res.user.email)}&next=${encodeURIComponent(workspaceHref)}`,
      );
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Signup failed');
    }
  });

  return (
    <AuthScaffold
      title="Join SkillForge"
      subtitle="Fill in your details to get started."
      brandMode="inside"
      footer={
        <span>
          Already have an account?{' '}
          <Link className="font-semibold text-primary transition hover:text-primary/80" href="/login">
            Login
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-3">
          <label htmlFor="fullName" className="text-base font-medium text-[var(--site-text)]">
            Full Name
          </label>
          <AuthInputField
            id="fullName"
            autoComplete="name"
            icon={User}
            placeholder="John Doe"
            {...form.register('fullName')}
          />
          {form.formState.errors.fullName?.message ? (
            <p className="text-sm text-[var(--site-danger)]">{form.formState.errors.fullName.message}</p>
          ) : null}
        </div>

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

        <div className="space-y-3">
          <label htmlFor="password" className="text-base font-medium text-[var(--site-text)]">
            Password
          </label>
          <AuthInputField
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
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

        <div className="space-y-3">
          <label className="text-base font-medium text-[var(--site-text)]">Learning Interests</label>
          <div className="rounded-[1.15rem] border border-[var(--site-border)] bg-[var(--site-bg-soft)] p-4">
            <div className="flex flex-wrap gap-3">
              {suggestedInterests.map((interest) => {
                const active = selectedInterests.some(
                  (value) => value.toLowerCase() === interest.toLowerCase(),
                );

                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition',
                      active
                        ? 'border-[var(--site-primary)] bg-[var(--site-primary)] text-white'
                        : 'border-[var(--site-border-strong)] bg-[var(--site-surface)] text-[var(--site-primary)] hover:bg-[var(--site-primary-soft)]',
                    )}
                  >
                    <span>{interest}</span>
                    {active ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </button>
                );
              })}

              <div className="inline-flex min-w-[12rem] flex-1 items-center rounded-full border border-[var(--site-border-strong)] bg-[var(--site-surface)] px-4 py-2">
                <input
                  value={customInterest}
                  onChange={(event) => setCustomInterest(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addCustomInterest();
                    }
                  }}
                  placeholder="Add interest..."
                  className="w-full bg-transparent text-sm text-[var(--site-text)] outline-none placeholder:text-[var(--site-subtle)]"
                />
                <button
                  type="button"
                  onClick={addCustomInterest}
                  className="text-[var(--site-primary)] transition hover:text-[var(--site-primary-strong)]"
                  aria-label="Add interest"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

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
          {form.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>
    </AuthScaffold>
  );
}
