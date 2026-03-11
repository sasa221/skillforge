import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="font-semibold tracking-tight">SkillForge</div>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="text-muted-foreground hover:text-foreground" href="/courses">
              Courses
            </Link>
            <Link className="text-muted-foreground hover:text-foreground" href="/pricing">
              Pricing
            </Link>
            <Link className="text-muted-foreground hover:text-foreground" href="/login">
              Login
            </Link>
            <Link
              className="rounded-md bg-primary px-3 py-2 text-primary-foreground hover:opacity-90"
              href="/signup"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <section className="container py-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Learn real skills with an AI teacher that keeps you moving.
            </h1>
            <p className="text-lg text-muted-foreground">
              Interactive micro-lessons, adaptive quizzes, gamified checkpoints, and a skill passport
              built around measurable progress.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
                href="/signup"
              >
                Start learning
              </Link>
              <Link className="rounded-md border px-4 py-2 hover:bg-muted" href="/courses">
                Browse courses
              </Link>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="space-y-3">
              <div className="text-sm font-medium">MVP includes</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>- AI lesson chat tutor (context-aware)</li>
                <li>- Micro-lessons + checkpoints/quizzes</li>
                <li>- Progress tracking + XP/levels</li>
                <li>- Admin dashboard to manage content</li>
              </ul>
              <div className="text-xs text-muted-foreground">
                Phase 2 starts implementing auth + onboarding.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

