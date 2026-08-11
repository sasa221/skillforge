-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN     "uploadedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "MediaAsset_uploadedByUserId_idx" ON "MediaAsset"("uploadedByUserId");

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
