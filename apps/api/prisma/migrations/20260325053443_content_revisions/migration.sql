-- CreateEnum
CREATE TYPE "ContentRevisionTarget" AS ENUM ('course', 'module', 'lesson');

-- CreateTable
CREATE TABLE "ContentRevision" (
    "id" TEXT NOT NULL,
    "target" "ContentRevisionTarget" NOT NULL,
    "summary" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL,
    "snapshot" JSONB NOT NULL,
    "actorId" TEXT,
    "courseId" TEXT,
    "moduleId" TEXT,
    "lessonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentRevision_target_createdAt_idx" ON "ContentRevision"("target", "createdAt");

-- CreateIndex
CREATE INDEX "ContentRevision_courseId_createdAt_idx" ON "ContentRevision"("courseId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentRevision_moduleId_createdAt_idx" ON "ContentRevision"("moduleId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentRevision_lessonId_createdAt_idx" ON "ContentRevision"("lessonId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentRevision_actorId_idx" ON "ContentRevision"("actorId");

-- AddForeignKey
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
