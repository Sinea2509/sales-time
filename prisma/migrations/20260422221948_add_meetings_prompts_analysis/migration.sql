-- CreateEnum
CREATE TYPE "MeetingOutcome" AS ENUM ('WON', 'LOST', 'FOLLOW_UP', 'NO_SHOW', 'OTHER');

-- CreateEnum
CREATE TYPE "AnalysisKind" AS ENUM ('SONCAS', 'DISC');

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "clerkOrgId" TEXT NOT NULL,
    "sellerUserId" TEXT NOT NULL,
    "prospectName" TEXT NOT NULL,
    "meetingAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER,
    "transcript" TEXT NOT NULL,
    "notes" TEXT,
    "outcome" "MeetingOutcome" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingAnalysis" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "kind" "AnalysisKind" NOT NULL,
    "promptVersionId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "rawText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL,
    "kind" "AnalysisKind" NOT NULL,
    "currentVersionId" TEXT,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptTemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "markdown" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Meeting_clerkOrgId_idx" ON "Meeting"("clerkOrgId");

-- CreateIndex
CREATE INDEX "Meeting_sellerUserId_idx" ON "Meeting"("sellerUserId");

-- CreateIndex
CREATE INDEX "MeetingAnalysis_meetingId_kind_idx" ON "MeetingAnalysis"("meetingId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "PromptTemplate_kind_key" ON "PromptTemplate"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "PromptTemplate_currentVersionId_key" ON "PromptTemplate"("currentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "PromptTemplateVersion_templateId_version_key" ON "PromptTemplateVersion"("templateId", "version");

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_sellerUserId_fkey" FOREIGN KEY ("sellerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAnalysis" ADD CONSTRAINT "MeetingAnalysis_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingAnalysis" ADD CONSTRAINT "MeetingAnalysis_promptVersionId_fkey" FOREIGN KEY ("promptVersionId") REFERENCES "PromptTemplateVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptTemplate" ADD CONSTRAINT "PromptTemplate_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "PromptTemplateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptTemplateVersion" ADD CONSTRAINT "PromptTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PromptTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptTemplateVersion" ADD CONSTRAINT "PromptTemplateVersion_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
