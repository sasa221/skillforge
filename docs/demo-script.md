## SkillForge demo script (5–8 minutes)

### Setup (before presenting)
- Run seed (`pnpm db:seed`) and confirm you can login with demo accounts.
- Open two tabs:
  - **Student view**: logged in as `student@skillforge.dev`
  - **Admin view**: logged in as `admin@skillforge.dev`
- Local URLs (default):
  - Web: `http://localhost:3100`
  - API: `http://localhost:3200` (Swagger at `/docs`)

### Student demo flow (step-by-step)
1) **Open `/courses`**
   - Say: “Public catalog shows only published content.”
   - Expected UI: course cards/list visible; no drafts.

2) **Open a course detail page**
   - Recommend: **SQL Fundamentals (beginner)** first.
   - Say: “You can preview the curriculum before enrolling.”
   - Expected UI: curriculum modules/lessons visible; enroll CTA.

3) **Enroll**
   - Click **Enroll now**.
   - Say: “Enrollments are idempotent—clicking twice won’t break.”
   - Expected UI: toast “Enrolled…”, redirect into dashboard course page.

4) **Open first lesson**
   - Say: “Lessons are structured blocks; progress is tracked per lesson.”
   - Expected UI: lesson content + AI teacher panel + quiz panel (if present).

5) **Use AI teacher**
   - Ask: “Explain this in one paragraph, then give a tiny example.”
   - Say: “AI is grounded in the lesson blocks + teacher notes, with history restored.”
   - Expected UI: “AI is typing…”, response appears; reload restores history.

6) **Complete 1–2 lessons**
   - If there’s a quiz, submit and pass; otherwise click **Mark complete**.
   - Say: “Completion updates XP/level, badges, and ‘Continue learning’.”
   - Expected UI: toast for completion / quiz score; dashboard shows completed lessons increment.

7) **Dashboard**
   - Open `/dashboard`.
   - Say: “After only 1–2 lessons you already see visible progress and a ‘Continue learning’ link.”

### Admin demo flow (step-by-step)
1) **Open `/admin`**
   - Say: “Admin is RBAC protected; students are redirected.”
   - Expected UI: overview metrics.

2) **Skills**
   - Create/edit a skill (draft → published).
   - Say: “Publishing controls what’s visible publicly.”
   - Expected UI: edits save, toast “saved”.

3) **Courses → Modules → Lessons**
   - Edit a course status, open module, open lesson.
   - Say: “Content is composed from lesson blocks; this MVP uses a JSON block editor.”

4) **Quizzes**
   - Open a quiz and add a question.
   - Say: “Quiz validation is strict: missing answers / invalid options are rejected cleanly.”

### Expected “talk track” one-liners
- “Public users only see published content.”
- “Enrollments and progress updates are safe to repeat.”
- “AI is lesson-grounded and fails gracefully with clear feedback.”
- “Admin publishing is controlled and RBAC protected.”

