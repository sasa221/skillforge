## Pilot test scenarios (prioritized)

### P0 — New user journey (student)
- **Signup → dashboard**: create account, land on dashboard.
- **Explore courses**: open `/courses`, open a course details page.
- **Enroll**: enroll into a published course and land in `/dashboard/courses/[courseSlug]`.
- **Open a lesson**: open first lesson; verify content loads.
- **AI tutoring**: send an AI message and receive a response; reload and confirm history.
- **Complete 1 lesson**: mark complete (or pass quiz if present).
- **Dashboard meaning**: dashboard shows XP/level and “continue learning”.

### P0 — Admin content publishing journey
- **Login as admin** and open `/admin`.
- **Create/edit skill** (draft → published).
- **Create course** (draft), add module, add lesson, add blocks, create quiz, add questions.
- **Publish** course/module/lesson/quiz.
- **Public visibility**: open `/courses` as logged-out user and confirm published content appears; drafts do not.

### P0 — AI tutoring journey (lesson-centered)
- Enroll and open a lesson with clear blocks.
- Ask “Explain” and “Give example”.
- Trigger a transient failure (wrong AI key or provider down) and confirm UX:
  - clear error message
  - retry possible
  - history not corrupted

### P1 — Progress & gamification consistency
- Complete multiple lessons across modules.
- Confirm course percent and module percent update.
- Pass a quiz and confirm lesson auto-completes.
- Confirm achievements/badges appear after first lesson/quiz/course.

### P1 — Unauthorized / forbidden flows
- Logged-out user opening `/dashboard/*` → redirect to login.
- Student opening `/admin/*` → redirect to dashboard.
- Enrolled vs not enrolled lesson open: API denies non-enrolled access.

