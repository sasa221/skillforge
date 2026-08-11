-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "avatarAssetId" TEXT;

-- CreateIndex
CREATE INDEX "Instructor_avatarAssetId_idx" ON "Instructor"("avatarAssetId");

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_avatarAssetId_fkey" FOREIGN KEY ("avatarAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
