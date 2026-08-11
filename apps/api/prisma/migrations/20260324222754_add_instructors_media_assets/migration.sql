-- CreateEnum
CREATE TYPE "MediaAssetType" AS ENUM ('image', 'video', 'file');

-- CreateEnum
CREATE TYPE "MediaAssetSourceType" AS ENUM ('external', 'upload', 'generated');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "coverImageAssetId" TEXT,
ADD COLUMN     "instructorId" TEXT,
ADD COLUMN     "introVideoAssetId" TEXT;

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "introVideoAssetId" TEXT;

-- CreateTable
CREATE TABLE "Instructor" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "altText" TEXT,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "durationSeconds" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "type" "MediaAssetType" NOT NULL,
    "sourceType" "MediaAssetSourceType" NOT NULL DEFAULT 'external',
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_slug_key" ON "Instructor"("slug");

-- CreateIndex
CREATE INDEX "Instructor_status_idx" ON "Instructor"("status");

-- CreateIndex
CREATE INDEX "Instructor_order_idx" ON "Instructor"("order");

-- CreateIndex
CREATE INDEX "Instructor_deletedAt_idx" ON "Instructor"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_url_key" ON "MediaAsset"("url");

-- CreateIndex
CREATE INDEX "MediaAsset_type_status_idx" ON "MediaAsset"("type", "status");

-- CreateIndex
CREATE INDEX "MediaAsset_sourceType_idx" ON "MediaAsset"("sourceType");

-- CreateIndex
CREATE INDEX "MediaAsset_deletedAt_idx" ON "MediaAsset"("deletedAt");

-- CreateIndex
CREATE INDEX "Course_instructorId_idx" ON "Course"("instructorId");

-- CreateIndex
CREATE INDEX "Course_coverImageAssetId_idx" ON "Course"("coverImageAssetId");

-- CreateIndex
CREATE INDEX "Course_introVideoAssetId_idx" ON "Course"("introVideoAssetId");

-- CreateIndex
CREATE INDEX "Module_introVideoAssetId_idx" ON "Module"("introVideoAssetId");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_coverImageAssetId_fkey" FOREIGN KEY ("coverImageAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_introVideoAssetId_fkey" FOREIGN KEY ("introVideoAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_introVideoAssetId_fkey" FOREIGN KEY ("introVideoAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
