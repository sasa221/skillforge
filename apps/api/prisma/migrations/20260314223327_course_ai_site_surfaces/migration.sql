-- CreateTable
CREATE TABLE "SiteSurface" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "eyebrow" TEXT,
    "description" TEXT,
    "body" TEXT,
    "bullets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cards" JSONB,
    "primaryCtaLabel" TEXT,
    "primaryCtaHref" TEXT,
    "secondaryCtaLabel" TEXT,
    "secondaryCtaHref" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSurface_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseAiSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseAiSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseAiMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "AiMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseAiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteSurface_slug_key" ON "SiteSurface"("slug");

-- CreateIndex
CREATE INDEX "SiteSurface_status_idx" ON "SiteSurface"("status");

-- CreateIndex
CREATE INDEX "CourseAiSession_userId_courseId_idx" ON "CourseAiSession"("userId", "courseId");

-- CreateIndex
CREATE INDEX "CourseAiMessage_sessionId_createdAt_idx" ON "CourseAiMessage"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "CourseAiSession" ADD CONSTRAINT "CourseAiSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAiSession" ADD CONSTRAINT "CourseAiSession_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAiMessage" ADD CONSTRAINT "CourseAiMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CourseAiSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
