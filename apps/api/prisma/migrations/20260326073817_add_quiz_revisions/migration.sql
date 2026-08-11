-- AlterEnum
ALTER TYPE "ContentRevisionTarget" ADD VALUE 'quiz';

-- AlterTable
ALTER TABLE "ContentRevision" ADD COLUMN     "quizId" TEXT;

-- CreateIndex
CREATE INDEX "ContentRevision_quizId_createdAt_idx" ON "ContentRevision"("quizId", "createdAt");

-- AddForeignKey
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
