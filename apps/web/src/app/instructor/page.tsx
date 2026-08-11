'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, FileText, ShieldCheck, Sparkles } from 'lucide-react';

import { AdminStatusPill, AdminSurface } from '@/components/admin/AdminUi';
import { AiContentMagic } from '@/components/instructor/AiContentMagic';
import { instructorWorkspaceApi } from '@/lib/api/endpoints';
import { useAuthStore } from '@/lib/auth/store';
import { headingFont } from '@/lib/fonts';
import { cn } from '@/lib/utils';

const adminRoles = new Set(['admin', 'content_manager', 'super_admin']);

export default function InstructorWorkspacePage() {
  const user = useAuthStore((state) => state.user);
  const workspaceQuery = useQuery({
    queryKey: ['instructor', 'workspace'],
    queryFn: instructorWorkspaceApi.workspace,
  });

  const displayName =
    user?.instructorProfile?.fullName ??
    user?.profile?.fullName ??
    user?.email?.split('@')[0] ??
    'Instructor';
  const canOpenAdmin = user?.roles?.some((role) => adminRoles.has(role)) ?? false;

  if (workspaceQuery.isLoading) {
    return (
      <main className="space-y-6">
        <div className="h-56 rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-40 rounded-[1.6rem] border border-[var(--site-border)] bg-[var(--site-surface)]"
            />
          ))}
        </div>
        <div className="h-[28rem] rounded-[1.8rem] border border-[var(--site-border)] bg-[var(--site-surface)]" />
      </main>
    );
  }

  if (workspaceQuery.isError || !workspaceQuery.data) {
    return (
      <main className="rounded-[1.8rem] border border-[var(--site-danger)]/20 bg-[var(--site-danger-soft)] p-6 text-sm text-[var(--site-danger)]">
        <div className="font-semibold">Could not load instructor workspace</div>
        <div className="mt-2 text-[var(--site-danger)]/80">
          {workspaceQuery.error instanceof Error
            ? workspaceQuery.error.message
            : 'Unknown error'}
        </div>
      </main>
    );
  }

  const workspace = workspaceQuery.data;

  if (!workspace.instructor) {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-6 py-8 shadow-[0_24px_60px_var(--site-shadow)] sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--site-border)] bg-[var(--site-primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--site-primary)]">
                <Sparkles className="h-4 w-4" />
                Instructor workspace
              </div>
              <h1
                className={cn(
                  'mt-5 text-5xl font-extrabold tracking-tight text-[var(--site-text)]',
                  headingFont.className,
                )}
              >
                Welcome, {displayName}
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-8 text-[var(--site-muted)]">
                This account can open the instructor workspace, but no active instructor profile is
                linked yet. Once an admin links your profile, your assigned courses and teaching
                stats will appear here.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-14 items-center justify-center rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 text-base font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
              >
                Open learner dashboard
              </Link>
              {canOpenAdmin ? (
                <Link
                  href="/admin/instructors"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.1rem] bg-primary px-5 text-base font-semibold text-primary-foreground shadow-[0_18px_34px_rgba(249,115,22,0.22)] transition hover:bg-primary/90"
                >
                  Manage instructors
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    );
  }

  const { instructor, stats, courses } = workspace;
  const avatarUrl = instructor.avatarUrl;
  const starterCourse = courses.find((course) => course.status === 'published') ?? courses[0] ?? null;

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-6 py-8 shadow-[0_24px_60px_var(--site-shadow)] sm:px-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.7rem] border border-[var(--site-border)] bg-[var(--site-primary-soft)] text-xl font-semibold text-[var(--site-primary)]">
              {avatarUrl ? (
                <img src={avatarUrl} alt={instructor.fullName} className="h-full w-full object-cover" />
              ) : (
                getInitials(instructor.fullName)
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <AdminStatusPill tone={statusTone(instructor.status)}>
                  {instructor.status.toUpperCase()}
                </AdminStatusPill>
                <AdminStatusPill tone="blue">Instructor profile linked</AdminStatusPill>
              </div>
              <h1
                className={cn(
                  'mt-4 text-5xl font-extrabold tracking-tight text-[var(--site-text)]',
                  headingFont.className,
                )}
              >
                {instructor.fullName}
              </h1>
              <p className="mt-3 text-xl text-[var(--site-muted)]">
                {instructor.title ?? 'Instructor'}
              </p>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--site-muted)]">
                {instructor.bio ??
                  'Use this workspace to keep track of the courses linked to your instructor profile and the teaching surface learners see across the product.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 xl:justify-end">
            {instructor.slug ? (
              <Link
                href={`/instructors/${instructor.slug}`}
                className="inline-flex h-14 items-center justify-center rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 text-base font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
              >
                View public profile
              </Link>
            ) : null}
            <Link
              href="/courses"
              className="inline-flex h-14 items-center justify-center rounded-[1.1rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] px-5 text-base font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
            >
              Open course catalog
            </Link>
            {canOpenAdmin ? (
              <Link
                href="/admin/instructors"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.1rem] bg-primary px-5 text-base font-semibold text-primary-foreground shadow-[0_18px_34px_rgba(249,115,22,0.22)] transition hover:bg-primary/90"
              >
                Manage instructor access
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <WorkspaceStat
          icon={BookOpen}
          label="Assigned courses"
          value={stats.totalCourses}
          helper={`${stats.publishedCourses} published`}
        />
        <WorkspaceStat
          icon={Sparkles}
          label="Draft courses"
          value={stats.draftCourses}
          helper="Ready for review"
        />
        <WorkspaceStat
          icon={FileText}
          label="Modules"
          value={stats.totalModules}
          helper="Across linked courses"
        />
        <WorkspaceStat
          icon={ShieldCheck}
          label="Lessons"
          value={stats.totalLessons}
          helper="Content currently linked"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px]">
        <AdminSurface>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-4xl font-semibold text-[var(--site-text)]">Assigned courses</h2>
              <p className="mt-2 text-lg text-[var(--site-muted)]">
                These courses currently use your instructor profile across the catalog and course pages.
              </p>
            </div>
            <AdminStatusPill tone={courses.length ? 'emerald' : 'slate'}>
              {courses.length} linked
            </AdminStatusPill>
          </div>

          {courses.length === 0 ? (
            <div className="mt-6 rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5 text-base leading-7 text-[var(--site-muted)]">
              No courses are linked to this instructor profile yet. Once an admin assigns a course to
              you, it will appear here automatically.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-[1.4rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <AdminStatusPill tone={statusTone(course.status)}>
                          {course.status.toUpperCase()}
                        </AdminStatusPill>
                        <AdminStatusPill tone="blue">{course.difficulty.toUpperCase()}</AdminStatusPill>
                      </div>
                      <h3 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--site-text)]">
                        {course.title}
                      </h3>
                      <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--site-muted)]">
                        {course.description ?? 'Course description will appear here once it is added.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 lg:justify-end">
                      <Link
                        href={`/instructor/courses/${course.id}/edit`}
                        className="inline-flex h-12 items-center justify-center rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
                      >
                        Manage content
                      </Link>
                      <Link
                        href={`/courses/${course.slug}`}
                        className="inline-flex h-12 items-center justify-center rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
                      >
                        View course page
                      </Link>
                      {canOpenAdmin ? (
                        <Link
                          href={`/admin/courses/${course.id}/edit`}
                          className="inline-flex h-12 items-center justify-center rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-primary-soft)]"
                        >
                          Edit in admin
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <DetailPill label="Modules" value={String(course.moduleCount)} />
                    <DetailPill label="Lessons" value={String(course.lessonCount)} />
                    <DetailPill label="Updated" value={formatDate(course.updatedAt)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminSurface>

        <div className="space-y-6">
          <AdminSurface>
            <h2 className="text-3xl font-semibold text-[var(--site-text)] flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
              AI Content Assistant
            </h2>
            <p className="mt-2 text-base leading-7 text-[var(--site-muted)] mb-5">
              Use AI to generate outlines, quiz questions, and improve your lesson text.
            </p>
            <AiContentMagic />
          </AdminSurface>

          <AdminSurface>
            <h2 className="text-3xl font-semibold text-[var(--site-text)]">Start here</h2>
            <p className="mt-2 text-base leading-7 text-[var(--site-muted)]">
              Use this shortcut when you want to open the most relevant public course page tied to your profile.
            </p>
            {starterCourse ? (
              <div className="mt-5 rounded-[1.3rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
                  Recommended first stop
                </div>
                <div className="mt-3 text-2xl font-semibold text-[var(--site-text)]">
                  {starterCourse.title}
                </div>
                <div className="mt-2 text-sm leading-7 text-[var(--site-muted)]">
                  {starterCourse.description ?? 'Open the course page to review the roadmap and learner-facing details.'}
                </div>
                <Link
                  href={`/courses/${starterCourse.slug}`}
                  className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_18px_34px_rgba(249,115,22,0.22)] transition hover:bg-primary/90"
                >
                  Open course page
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="mt-5 rounded-[1.3rem] border border-[var(--site-border)] bg-[var(--site-surface-alt)] p-5 text-sm leading-7 text-[var(--site-muted)]">
                Once a course is assigned, the best starting point will appear here automatically.
              </div>
            )}
          </AdminSurface>

          <AdminSurface>
            <h2 className="text-3xl font-semibold text-[var(--site-text)]">What updates automatically</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--site-muted)]">
              <li>Course cards pick up your linked profile and avatar.</li>
              <li>Public instructor pages update when your profile changes.</li>
              <li>Assigned course counts stay in sync with the database.</li>
            </ul>
          </AdminSurface>
        </div>
      </section>
    </main>
  );
}

function WorkspaceStat({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <AdminSurface className="p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[var(--site-primary-soft)] text-[var(--site-primary)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
        {label}
      </div>
      <div className="mt-3 text-5xl font-semibold tracking-tight text-[var(--site-text)]">
        {value}
      </div>
      <div className="mt-3 text-base text-[var(--site-muted)]">{helper}</div>
    </AdminSurface>
  );
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--site-subtle)]">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-[var(--site-text)]">{value}</div>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function statusTone(status: string) {
  if (status === 'published') return 'emerald' as const;
  if (status === 'archived') return 'slate' as const;
  return 'orange' as const;
}
