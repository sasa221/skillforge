-- AlterEnum
ALTER TYPE "UserRoleType" ADD VALUE 'instructor';

-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_userId_key" ON "Instructor"("userId");

-- CreateIndex
CREATE INDEX "Instructor_userId_idx" ON "Instructor"("userId");

-- AddForeignKey
ALTER TABLE "Instructor"
ADD CONSTRAINT "Instructor_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
