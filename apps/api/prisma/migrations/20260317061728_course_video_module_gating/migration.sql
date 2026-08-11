-- AlterEnum
ALTER TYPE "LessonBlockType" ADD VALUE 'video';

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "introVideoUrl" TEXT,
ADD COLUMN     "requiresSequentialModules" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "introVideoUrl" TEXT;
