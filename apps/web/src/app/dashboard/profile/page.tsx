'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  ArrowUpRight,
  Award,
  BookOpenText,
  Clock3,
  Globe2,
  Medal,
  Pencil,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';

import { profilesApi, progressApi, usersApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/lib/auth/store';
import type { MeUser } from '@/lib/auth/types';
import type { ProfileProgress } from '@/lib/content/types';
import type { Profile } from '@/lib/profile/types';
import { cn } from '@/lib/utils';

const schema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(120),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  interests: z.string().optional(),
  learningGoals: z.string().max(500).optional().or(z.literal('')),
  bio: z.string().max(500).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export default function ProfilePage() {
  const qc = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [isEditing, setIsEditing] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState<string | null>(null);
  const editorRef = React.useRef<HTMLElement | null>(null);

  const meQuery = useQuery({
    queryKey: ['users', 'me'],
    queryFn: usersApi.me,
    initialData: authUser ?? undefined,
  });

  const profileQuery = useQuery({
    queryKey: ['profiles', 'me'],
    queryFn: profilesApi.me,
  });

  const progressQuery = useQuery({
    queryKey: ['progress', 'profile'],
    queryFn: progressApi.profile,
  });

  const dashboardQuery = useQuery({
    queryKey: ['progress', 'dashboard'],
    queryFn: progressApi.dashboard,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyFormValues,
  });

  React.useEffect(() => {
    form.reset(buildFormValues(meQuery.data, profileQuery.data));
  }, [form, meQuery.data, profileQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const interests =
        values.interests
          ?.split(',')
          .map((item) => item.trim())
          .filter(Boolean) ?? [];

      const [me, profile] = await Promise.all([
        usersApi.patchMe({ email: values.email }),
        profilesApi.patchMe({
          fullName: values.fullName,
          avatarUrl: values.avatarUrl || undefined,
          interests,
          learningGoals: values.learningGoals || undefined,
          bio: values.bio || undefined,
        }),
      ]);

      const mergedUser: MeUser = {
        ...me,
        profile: {
          fullName: profile.fullName,
          avatarUrl: profile.avatarUrl,
          interests: profile.interests,
          xp: profile.xp,
          level: profile.level,
        },
      };

      if (accessToken) {
        setSession(accessToken, mergedUser);
      }

      await Promise.all([
        qc.invalidateQueries({ queryKey: ['auth', 'me'] }),
        qc.invalidateQueries({ queryKey: ['users', 'me'] }),
        qc.invalidateQueries({ queryKey: ['profiles', 'me'] }),
      ]);

      return { me: mergedUser, profile };
    },
  });

  React.useEffect(() => {
    if (!updateMutation.isSuccess) return;
    setSavedMsg('Saved');
    const timeoutId = window.setTimeout(() => setSavedMsg(null), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [updateMutation.isSuccess]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSavedMsg(null);
    await updateMutation.mutateAsync(values);
  });

  const displayName = profileQuery.data?.fullName ?? meQuery.data?.profile?.fullName ?? meQuery.data?.email?.split('@')[0] ?? 'SkillForge Learner';
  const avatarUrl = profileQuery.data?.avatarUrl ?? meQuery.data?.profile?.avatarUrl ?? null;
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  const email = meQuery.data?.email ?? '';
  const username = profileQuery.data?.username?.trim() ?? '';
  const interests = profileQuery.data?.interests ?? meQuery.data?.profile?.interests ?? [];
  const learningGoals = profileQuery.data?.learningGoals?.trim() ?? '';
  const bio = profileQuery.data?.bio?.trim() ?? '';

  const xp = progressQuery.data?.xp ?? profileQuery.data?.xp ?? meQuery.data?.profile?.xp ?? 0;
  const level = progressQuery.data?.level ?? profileQuery.data?.level ?? meQuery.data?.profile?.level ?? 1;
  const streakDays = progressQuery.data?.streakDays ?? dashboardQuery.data?.streakDays ?? profileQuery.data?.streakDays ?? 0;
  const badges = progressQuery.data?.badges ?? [];
  const achievements = progressQuery.data?.achievements ?? [];
  const courses = progressQuery.data?.courses ?? [];
  const stats = progressQuery.data?.stats;
  const completedCourses = stats?.completedCoursesCount ?? courses.filter((course) => course.status === 'completed').length;
  const certificateCount = stats?.certificateCount ?? 0;
  const globalRank = stats?.globalRank ?? null;
  const topPercent = stats?.topPercent ?? null;
  const nextLevelXp = stats?.nextLevelXp ?? xp;
  const levelProgressPercent = stats?.levelProgressPercent ?? 0;
  const roleLabel = formatRoleLabel(meQuery.data?.roles ?? []);
  const portfolioItems = progressQuery.data?.portfolioItems ?? [];
  const activityItems = progressQuery.data?.recentActivity ?? [];
  const activeCoursesCount = courses.filter((course) => course.status === 'in_progress').length;
  const currentFocus = dashboardQuery.data?.continueLesson?.courseTitle ?? portfolioItems[0]?.title ?? null;

  const openEditor = () => {
    setIsEditing(true);
    window.setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  if (profileQuery.isLoading || progressQuery.isLoading || dashboardQuery.isLoading) {
    return (
      <main className="space-y-6 pb-6">
        <div className="grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="h-[31rem] rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
            <div className="h-[18rem] rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
            <div className="h-56 rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
          </div>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-36 rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
              <div className="h-36 rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
              <div className="h-36 rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
            </div>
            <div className="h-[22rem] rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
            <div className="h-[22rem] rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
          </div>
        </div>
      </main>
    );
  }

  if (meQuery.isError || profileQuery.isError || progressQuery.isError || dashboardQuery.isError) {
    return (
      <main className="rounded-[1.8rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
        <div className="font-semibold">Could not load your profile</div>
        <div className="mt-2">
          {meQuery.error instanceof Error
            ? meQuery.error.message
            : profileQuery.error instanceof Error
              ? profileQuery.error.message
              : progressQuery.error instanceof Error
                ? progressQuery.error.message
                : dashboardQuery.error instanceof Error
                  ? dashboardQuery.error.message
                  : 'Unknown error'}
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 pb-6">
      <section className="grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-[var(--site-border)] bg-[radial-gradient(circle_at_top_right,var(--site-primary-soft),transparent_28%),var(--site-surface)] p-8 shadow-[0_28px_80px_var(--site-shadow)]">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-[5px] border-[var(--site-primary)] bg-[radial-gradient(circle_at_top,#f7ede0_0%,#e5c49c_52%,#d79b5d_100%)] shadow-[0_18px_40px_var(--site-shadow)]">
                  {avatarUrl ? (
                    <div
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${avatarUrl})` }}
                    />
                  ) : (
                    <span className="text-5xl font-semibold text-[var(--site-text)]">{initials || 'SF'}</span>
                  )}
                </div>
              </div>

              <h1 className="mt-8 text-5xl font-semibold tracking-tight text-[var(--site-text)]">{displayName}</h1>
              <p className="mt-3 text-2xl text-[var(--site-primary)]">{roleLabel}</p>
            </div>

            <div className="mt-10">
              <div className="flex items-center justify-between gap-4 text-sm font-semibold uppercase tracking-[0.16em]">
                <span className="text-[var(--site-subtle)]">Level {level}</span>
                <span className="text-[var(--site-muted)]">
                  {xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
                </span>
              </div>
              <div className="mt-4 h-4 rounded-full bg-[var(--site-border)]">
                <div
                  className="h-4 rounded-full bg-[var(--site-primary)] shadow-[0_10px_24px_var(--site-shadow)]"
                  style={{ width: `${levelProgressPercent}%` }}
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={openEditor}
                className="inline-flex h-16 flex-1 items-center justify-center gap-2 rounded-[1.25rem] bg-[var(--site-primary)] px-6 text-lg font-semibold text-white shadow-[0_18px_34px_var(--site-shadow)] transition hover:bg-[var(--site-primary-strong)]"
              >
                <Pencil className="h-5 w-5" />
                Edit Profile
              </button>
              <Link
                href="/dashboard/achievements"
                aria-label="Open achievements"
                className="inline-flex h-16 w-16 items-center justify-center rounded-[1.25rem] border border-[var(--site-primary)]/20 bg-[var(--site-primary-soft)] text-[var(--site-primary)] transition hover:bg-[var(--site-primary-soft)]"
              >
                <ArrowUpRight className="h-5 w-5" />
              </Link>
            </div>
          </section>

          <Panel title="Personal Info" icon={Sparkles}>
            <InfoBlock label="Email Address" value={email} />
            <InfoBlock label="Username" value={username ? `@${username}` : 'Not set yet'} />
            <InfoBlock
              label="Bio"
              value={bio || 'Add a short profile bio from the editor.'}
              multiline
              empty={!bio}
            />
            <InfoBlock
              label="Learning Goal"
              value={learningGoals || 'Add your current learning goal from the editor.'}
              multiline
              empty={!learningGoals}
            />
          </Panel>

            <Panel title="Learning Preferences" icon={Target}>
            <div className="flex flex-wrap gap-3">
              {interests.length === 0 ? (
                <span className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-4 py-2 text-sm text-[var(--site-muted)]">
                  Add your learning interests from the editor.
                </span>
              ) : (
                interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
                  >
                    {toTitleCase(interest)}
                  </span>
                ))
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <MiniMetric label="Active streak" value={`${streakDays} days`} />
              <MiniMetric
                label="Current focus"
                value={currentFocus ?? 'Choose your next course'}
              />
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Courses Completed"
              value={completedCourses.toLocaleString()}
              detail={
                activeCoursesCount > 0
                  ? `${activeCoursesCount} active course${activeCoursesCount === 1 ? '' : 's'} in progress`
                  : 'Progress updates from your active courses'
              }
              icon={BookOpenText}
            />
            <StatCard
              title="Global Rank"
              value={globalRank ? `#${globalRank.toLocaleString()}` : 'Not ranked'}
              detail={topPercent ? `Top ${topPercent}%` : 'Rank appears once you build enough activity'}
              icon={Globe2}
            />
            <StatCard
              title="Certificates"
              value={certificateCount.toLocaleString()}
              detail={`${stats?.badgesCount ?? badges.length} badges earned`}
              icon={Medal}
            />
          </section>

          <Panel
            title="Skills Portfolio"
            icon={Award}
            action={
              <Link
                href="/dashboard/courses"
                className="text-lg font-semibold text-primary transition hover:text-primary/80"
              >
                Open My Courses
              </Link>
            }
          >
            <div className="space-y-8">
              {portfolioItems.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5 text-sm leading-6 text-[var(--site-muted)]">
                  Your portfolio will start filling in here once you enroll in courses and begin making progress.
                </div>
              ) : (
                portfolioItems.map((item, index) => (
                  <div key={item.title}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-lg font-semibold text-[var(--site-primary)]">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-[1.65rem] font-semibold text-[var(--site-text)]">{item.title}</div>
                          <div className="mt-1 text-sm text-[var(--site-muted)]">{item.description}</div>
                        </div>
                      </div>
                      <div className="text-4xl font-semibold text-[var(--site-primary)]">{item.percent}%</div>
                    </div>
                    <div className="mt-5 h-4 rounded-full bg-[var(--site-border)]">
                      <div
                        className="h-4 rounded-full bg-[linear-gradient(90deg,var(--site-primary)_0%,#ff9b49_100%)]"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Recent Activity" icon={Clock3}>
            {activityItems.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5 text-sm leading-6 text-[var(--site-muted)]">
                No activity yet. Complete lessons, pass quizzes, or unlock badges and this feed will update automatically.
              </div>
            ) : (
              <div className="space-y-6">
                {activityItems.map((item, index) => (
                  <div key={item.id} className="relative pl-10">
                    <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--site-primary)]/20 bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
                      <div className="h-2.5 w-2.5 rounded-full bg-current" />
                    </div>
                    {index < activityItems.length - 1 ? (
                      <div className="absolute left-[11px] top-7 h-[calc(100%+1.25rem)] w-px bg-[var(--site-primary)]/20" />
                    ) : null}
                    <div className="rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-3xl font-semibold text-[var(--site-text)]">{item.title}</div>
                          <p className="mt-2 text-base leading-8 text-[var(--site-muted)]">
                            {item.description ?? 'Activity recorded in your learning feed.'}
                          </p>
                          {item.href ? (
                            <Link
                              href={item.href}
                              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--site-primary)] transition hover:text-[var(--site-primary-strong)]"
                            >
                              Open item
                              <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          ) : null}
                        </div>
                        <div className="text-sm font-medium text-[var(--site-subtle)]">
                          {formatRelativeTime(item.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {isEditing ? (
            <section
              ref={editorRef}
              className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-8 shadow-[0_26px_72px_var(--site-shadow)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-4xl font-semibold text-[var(--site-text)]">Edit Profile</h2>
                  <p className="mt-2 text-base text-[var(--site-muted)]">
                    Changes save directly to your current SkillForge account.
                  </p>
                </div>
                {savedMsg ? (
                  <div className="rounded-full border border-[var(--site-primary)]/25 bg-[var(--site-primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--site-primary)]">
                    {savedMsg}
                  </div>
                ) : null}
              </div>

              <form onSubmit={onSubmit} className="mt-8 space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Full Name" error={form.formState.errors.fullName?.message}>
                    <input className={inputClassName} autoComplete="name" {...form.register('fullName')} />
                  </Field>
                  <Field label="Email Address" error={form.formState.errors.email?.message}>
                    <input className={inputClassName} type="email" autoComplete="email" {...form.register('email')} />
                  </Field>
                </div>

                <Field label="Avatar URL" error={form.formState.errors.avatarUrl?.message}>
                  <input
                    className={inputClassName}
                    placeholder="https://example.com/avatar.png"
                    {...form.register('avatarUrl')}
                  />
                </Field>

                <Field label="Interests" hint="Separate interests with commas.">
                  <input
                    className={inputClassName}
                    placeholder="sql, python, data science"
                    {...form.register('interests')}
                  />
                </Field>

                <div className="grid gap-5 lg:grid-cols-2">
                  <Field label="Learning Goals" error={form.formState.errors.learningGoals?.message}>
                    <textarea
                      className={textareaClassName}
                      rows={4}
                      placeholder="What are you aiming to achieve next?"
                      {...form.register('learningGoals')}
                    />
                  </Field>
                  <Field label="Bio" error={form.formState.errors.bio?.message}>
                    <textarea
                      className={textareaClassName}
                      rows={4}
                      placeholder="Tell other learners what you are focused on."
                      {...form.register('bio')}
                    />
                  </Field>
                </div>

                {updateMutation.isError ? (
                  <div className="rounded-[1.2rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] px-4 py-3 text-sm text-[var(--site-danger)]">
                    {updateMutation.error instanceof Error ? updateMutation.error.message : 'Update failed'}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="inline-flex h-14 items-center justify-center rounded-[1.1rem] bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[0_18px_30px_rgba(249,115,22,0.22)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="inline-flex h-14 items-center justify-center rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-6 text-base font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
                  >
                    Close Editor
                  </button>
                </div>
              </form>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}

const emptyFormValues: FormValues = {
  email: '',
  fullName: '',
  avatarUrl: '',
  interests: '',
  learningGoals: '',
  bio: '',
};

const inputClassName =
  'h-14 w-full rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-bg-soft)] px-4 text-base text-[var(--site-text)] outline-none transition placeholder:text-[var(--site-subtle)] focus:border-[var(--site-primary)]/45';

const textareaClassName =
  'min-h-[140px] w-full rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-bg-soft)] px-4 py-4 text-base text-[var(--site-text)] outline-none transition placeholder:text-[var(--site-subtle)] focus:border-[var(--site-primary)]/45';

function Panel({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: typeof Trophy;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-7 shadow-[0_24px_64px_var(--site-shadow)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
            <Icon className="h-6 w-6" />
          </div>
          <h2 className="text-4xl font-semibold text-[var(--site-text)]">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-7">{children}</div>
    </section>
  );
}

function StatCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof Medal;
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-[0_20px_54px_var(--site-shadow)]">
      <div className="absolute -bottom-5 right-4 text-[var(--site-primary)]/10">
        <Icon className="h-24 w-24" />
      </div>
      <div className="relative">
        <div className="text-lg text-[var(--site-muted)]">{title}</div>
        <div className="mt-3 text-6xl font-semibold tracking-tight text-[var(--site-text)]">{value}</div>
        <div className="mt-4 text-lg font-semibold text-emerald-400">{detail}</div>
      </div>
    </section>
  );
}

function InfoBlock({
  label,
  value,
  multiline = false,
  empty = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  empty?: boolean;
}) {
  return (
    <div className="border-b border-[var(--site-border)] py-4 last:border-b-0 last:pb-0 first:pt-0">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">{label}</div>
      <div
        className={cn(
          'mt-3 text-[1.15rem] font-medium text-[var(--site-text)]',
          multiline && 'leading-8',
          multiline && !empty && 'text-[var(--site-muted)]',
          empty && 'text-[var(--site-subtle)]',
        )}
      >
        {value}
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-4">
      <div className="text-sm uppercase tracking-[0.16em] text-[var(--site-subtle)]">{label}</div>
      <div className="mt-3 text-lg font-semibold text-[var(--site-text)]">{value}</div>
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-3">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">{label}</div>
      {children}
      {error ? <p className="text-sm text-[var(--site-danger)]">{error}</p> : null}
      {!error && hint ? <p className="text-sm text-[var(--site-subtle)]">{hint}</p> : null}
    </label>
  );
}

function buildFormValues(me: MeUser | undefined, profile: Profile | undefined): FormValues {
  return {
    email: me?.email ?? '',
    fullName: profile?.fullName ?? me?.profile?.fullName ?? '',
    avatarUrl: profile?.avatarUrl ?? me?.profile?.avatarUrl ?? '',
    interests: (profile?.interests ?? me?.profile?.interests ?? []).join(', '),
    learningGoals: profile?.learningGoals ?? '',
    bio: profile?.bio ?? '',
  };
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return 'Recently';
  }

  const diffMs = timestamp - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, 'day');
}

function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function formatRoleLabel(roles: MeUser['roles']) {
  const primaryRole = roles[0];
  if (!primaryRole) return 'Learner';

  switch (primaryRole) {
    case 'super_admin':
      return 'Super Admin';
    case 'content_manager':
      return 'Content Manager';
    case 'admin':
      return 'Admin';
    case 'student':
    default:
      return 'Learner';
  }
}
