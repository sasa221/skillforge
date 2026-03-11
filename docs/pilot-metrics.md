## Pilot metrics (manual tracking guide)

This MVP logs key events into `AuditLog` (database). You can compute pilot metrics by querying `AuditLog` and a few core tables.

### Event names (expected)
- `user_signup`
- `user_login`
- `course_enrolled`
- `lesson_opened`
- `lesson_completed`
- `quiz_submitted`
- `quiz_passed`
- `ai_message_sent`
- `course_completed`

### Suggested reporting cadence
- Daily during pilot week 1, then weekly.

### Signup → enroll rate
- **Definition**: users who enrolled in any course / users who signed up
- **Signals**
  - numerator: distinct `actorUserId` with `course_enrolled`
  - denominator: distinct `actorUserId` with `user_signup`

### Enroll → first lesson completion
- **Definition**: users who completed at least 1 lesson / users who enrolled
- **Signals**
  - numerator: distinct `actorUserId` with `lesson_completed`
  - denominator: distinct `actorUserId` with `course_enrolled`

### Lesson completion → next lesson (continuation)
- **Definition**: users who complete 2+ lessons within the same course path
- **Signals**
  - use `LessonProgress` counts per user (completedAt not null)
  - or count `lesson_completed` events per user and look for `>= 2` within a time window

### AI usage per active user
- **Definition**: AI messages sent / active users
- **Signals**
  - numerator: count of `ai_message_sent`
  - denominator: distinct users with `user_login` (or any activity event) in the same period

### Course completion %
- **Definition**: completed courses / enrolled courses
- **Signals**
  - numerator: count of `course_completed` (distinct `actorUserId` + `entityId`)
  - denominator: count of `course_enrolled` (distinct `actorUserId` + `entityId`)

### Notes / caveats
- `lesson_opened` is tracked from the client, so it can be under-counted if JS is blocked or the call fails.
- `course_enrolled` may include `alreadyEnrolled: true` in metadata for idempotent repeats; filter those out if you want “first time only”.

