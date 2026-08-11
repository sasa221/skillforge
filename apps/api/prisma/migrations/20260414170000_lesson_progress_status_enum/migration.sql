-- Create enum for lesson progress status and migrate column without data loss.
CREATE TYPE "LessonProgressStatus" AS ENUM ('not_started', 'in_progress', 'completed');

ALTER TABLE "LessonProgress"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "LessonProgressStatus" USING ("status"::"LessonProgressStatus"),
  ALTER COLUMN "status" SET DEFAULT 'not_started';
