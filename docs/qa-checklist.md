## SkillForge MVP manual QA checklist

For prioritized end-to-end flows, also run: `docs/test-scenarios.md`.

### Auth
- **Signup**: create a new student account and land on dashboard.
- **Login**: login with seeded accounts.
- **Logout**: session clears and protected routes redirect to login.
- **Refresh**: close tab, reopen, load `/dashboard` and session restores (refresh cookie).
- **Unauthorized**: open `/dashboard/*` when logged out → redirect to `/login?next=...`.

### Public content visibility
- **Courses list**: `/courses` shows only published courses.
- **Course details**: `/courses/[slug]` shows only published modules/lessons.
- **Unpublished**: admin sets course/module/lesson to draft → it disappears from public pages.

### Enrollments
- **Enroll**: from course details, enroll and see it in `/dashboard/courses`.
- **Double enroll**: enroll twice → no crash; stays enrolled.
- **Forbidden**: try opening lesson dashboard URL without enrollment → blocked by API.

### Lesson flow
- **Open lesson**: `/dashboard/lessons/[lessonSlug]` loads content blocks correctly.
- **Navigation**: prev/next works; sibling list highlights current lesson.
- **Mark complete**: completes lesson; dashboard and course progress update.
- **Course completion**: complete all lessons → course shows completed and certificate is created.

### Quiz flow
- **Quiz exists**: lesson with quiz shows questions.
- **Validation**: submit requires selecting answers for all questions.
- **Pass**: passing marks lesson complete and awards XP once.
- **Fail**: failing shows feedback; AI “Explain with AI” works.

### Progress & gamification
- **Dashboard**: `/dashboard` shows XP/level and recent activity.
- **Profile**: `/dashboard/profile` edits save and persist.
- **Achievements**: `/dashboard/achievements` shows earned achievements/badges after actions.

### AI teacher
- **Empty state**: shows a clear prompt when no messages exist.
- **Send**: message sends, shows “AI is typing…”, response appears.
- **Error**: simulate provider failure → shows toast and does not corrupt history.
- **History restore**: reload page → previous chat history restores.

### Admin RBAC and CRUD
- **Access control**: student visiting `/admin/*` redirects to dashboard.
- **Admin overview**: `/admin` loads metrics.
- **Skills**: create/edit/archive skill.
- **Courses**: create course, edit, archive.
- **Modules**: create module in course, edit module, archive.
- **Lessons**: create lesson, edit metadata, edit blocks JSON, archive.
- **Quizzes**: create/upsert quiz for lesson, edit quiz, add/delete questions.
- **Publishing**: set content to published and verify it appears publicly.
- **Public users only see published**: verify drafts are hidden from public APIs/pages.

### Deployment checks
- **Health**: API `GET /health` returns `{ ok: true }`.
- **Swagger**: API docs available at `/docs`.

