-- CreateEnum
CREATE TYPE "ContentReviewStatus" AS ENUM ('draft', 'submitted', 'changes_requested', 'approved');

-- AlterTable
ALTER TABLE "Course"
ADD COLUMN "reviewNotes" TEXT,
ADD COLUMN "reviewStatus" "ContentReviewStatus" NOT NULL DEFAULT 'approved';

-- AlterTable
ALTER TABLE "Module"
ADD COLUMN "reviewNotes" TEXT,
ADD COLUMN "reviewStatus" "ContentReviewStatus" NOT NULL DEFAULT 'approved';

-- AlterTable
ALTER TABLE "Lesson"
ADD COLUMN "reviewNotes" TEXT,
ADD COLUMN "reviewStatus" "ContentReviewStatus" NOT NULL DEFAULT 'approved';

-- Backfill legacy published content as approved and legacy drafts as draft.
UPDATE "Course"
SET "reviewStatus" = CASE
  WHEN "status" = 'draft' THEN 'draft'::"ContentReviewStatus"
  ELSE 'approved'::"ContentReviewStatus"
END;

UPDATE "Module"
SET "reviewStatus" = CASE
  WHEN "status" = 'draft' THEN 'draft'::"ContentReviewStatus"
  ELSE 'approved'::"ContentReviewStatus"
END;

UPDATE "Lesson"
SET "reviewStatus" = CASE
  WHEN "status" = 'draft' THEN 'draft'::"ContentReviewStatus"
  ELSE 'approved'::"ContentReviewStatus"
END;

-- CreateIndex
CREATE INDEX "Course_reviewStatus_idx" ON "Course"("reviewStatus");

-- CreateIndex
CREATE INDEX "Module_reviewStatus_idx" ON "Module"("reviewStatus");

-- CreateIndex
CREATE INDEX "Lesson_reviewStatus_idx" ON "Lesson"("reviewStatus");
