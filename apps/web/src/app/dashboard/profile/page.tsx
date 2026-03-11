'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { profilesApi, progressApi, usersApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/lib/auth/store';

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
  const authUser = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);

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

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: meQuery.data?.email ?? '',
      fullName: profileQuery.data?.fullName ?? meQuery.data?.profile?.fullName ?? '',
      avatarUrl: profileQuery.data?.avatarUrl ?? meQuery.data?.profile?.avatarUrl ?? '',
      interests: (profileQuery.data?.interests ?? meQuery.data?.profile?.interests ?? []).join(', '),
      learningGoals: profileQuery.data?.learningGoals ?? '',
      bio: profileQuery.data?.bio ?? '',
    },
    values: {
      email: meQuery.data?.email ?? '',
      fullName: profileQuery.data?.fullName ?? meQuery.data?.profile?.fullName ?? '',
      avatarUrl: profileQuery.data?.avatarUrl ?? meQuery.data?.profile?.avatarUrl ?? '',
      interests: (profileQuery.data?.interests ?? meQuery.data?.profile?.interests ?? []).join(', '),
      learningGoals: profileQuery.data?.learningGoals ?? '',
      bio: profileQuery.data?.bio ?? '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const interests =
        values.interests
          ?.split(',')
          .map((s) => s.trim())
          .filter(Boolean) ?? [];

      const [me, profile] = await Promise.all([
        usersApi.patchMe({ email: values.email }),
        profilesApi.patchMe({
          fullName: values.fullName,
          avatarUrl: values.avatarUrl ? values.avatarUrl : undefined,
          interests,
          learningGoals: values.learningGoals ? values.learningGoals : undefined,
          bio: values.bio ? values.bio : undefined,
        }),
      ]);

      // keep auth store in sync with updated user/profile snapshot
      if (accessToken) setSession(accessToken, me);
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      await qc.invalidateQueries({ queryKey: ['users', 'me'] });
      await qc.invalidateQueries({ queryKey: ['profiles', 'me'] });
      return { me, profile };
    },
  });

  const [savedMsg, setSavedMsg] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!updateMutation.isSuccess) return;
    setSavedMsg('Saved');
    const t = setTimeout(() => setSavedMsg(null), 1500);
    return () => clearTimeout(t);
  }, [updateMutation.isSuccess]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSavedMsg(null);
    await updateMutation.mutateAsync(values);
  });

  return (
    <main className="container py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-2 text-muted-foreground">Update your profile details and learning preferences.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">XP</div>
          <div className="mt-1 text-2xl font-semibold">{progressQuery.data?.xp ?? profileQuery.data?.xp ?? 0}</div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">Level</div>
          <div className="mt-1 text-2xl font-semibold">{progressQuery.data?.level ?? profileQuery.data?.level ?? 1}</div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm text-muted-foreground">Badges</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {progressQuery.data?.badges?.length ?? 0} earned
          </div>
        </div>
      </div>

      {(meQuery.isError || profileQuery.isError) && (
        <div className="mt-6 rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm font-medium">Couldn’t load profile</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {meQuery.error instanceof Error
              ? meQuery.error.message
              : profileQuery.error instanceof Error
                ? profileQuery.error.message
                : 'Unknown error'}
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm font-medium">Badges</div>
          {progressQuery.isLoading ? (
            <div className="mt-2 text-sm text-muted-foreground">Loading…</div>
          ) : (progressQuery.data?.badges?.length ?? 0) === 0 ? (
            <div className="mt-2 text-sm text-muted-foreground">No badges yet.</div>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {progressQuery.data!.badges.map((b) => (
                <li key={b.key} className="flex items-center justify-between gap-3">
                  <span>{b.title}</span>
                  <span className="text-xs text-muted-foreground">{b.key}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="text-sm font-medium">Courses</div>
          {progressQuery.isLoading ? (
            <div className="mt-2 text-sm text-muted-foreground">Loading…</div>
          ) : (progressQuery.data?.courses?.length ?? 0) === 0 ? (
            <div className="mt-2 text-sm text-muted-foreground">No course progress yet.</div>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {progressQuery.data!.courses.map((c) => (
                <li key={c.course.id} className="flex items-center justify-between gap-3">
                  <span>{c.course.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.percent}% {c.status === 'completed' ? '• Completed' : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 rounded-xl border bg-card p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
            {form.formState.errors.email?.message ? (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" autoComplete="name" {...form.register('fullName')} />
            {form.formState.errors.fullName?.message ? (
              <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="avatarUrl">Avatar URL</Label>
          <Input id="avatarUrl" placeholder="https://…" {...form.register('avatarUrl')} />
          {form.formState.errors.avatarUrl?.message ? (
            <p className="text-sm text-destructive">{form.formState.errors.avatarUrl.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="interests">Interests (comma-separated)</Label>
          <Input id="interests" placeholder="sql, excel, python" {...form.register('interests')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="learningGoals">Learning goals</Label>
          <Input id="learningGoals" placeholder="What do you want to achieve?" {...form.register('learningGoals')} />
          {form.formState.errors.learningGoals?.message ? (
            <p className="text-sm text-destructive">{form.formState.errors.learningGoals.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Input id="bio" placeholder="Optional" {...form.register('bio')} />
          {form.formState.errors.bio?.message ? (
            <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>
          ) : null}
        </div>

        {updateMutation.isError ? (
          <div className="rounded-md border bg-muted p-3 text-sm">
            {updateMutation.error instanceof Error ? updateMutation.error.message : 'Update failed'}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
          {savedMsg ? <span className="text-sm text-muted-foreground">{savedMsg}</span> : null}
        </div>
      </form>
    </main>
  );
}

