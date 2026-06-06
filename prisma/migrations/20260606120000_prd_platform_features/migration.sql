-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');
CREATE TYPE "MeetingSourceType" AS ENUM ('UPLOAD', 'TRANSCRIPT');
CREATE TYPE "AnalysisJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'DONE', 'FAILED', 'DEAD');
CREATE TYPE "AiCallKind" AS ENUM ('DISC', 'SONCAS', 'COACHING', 'PREPARE', 'EMAIL');
CREATE TYPE "AiCallStatus" AS ENUM ('SUCCESS', 'ERROR');
CREATE TYPE "PlanRequestStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'DISMISSED');
CREATE TYPE "FeedbackType" AS ENUM ('BUG', 'IDEA', 'QUESTION', 'OTHER');
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'WONT_FIX');

-- AlterTable Organization
ALTER TABLE "Organization" ADD COLUMN "trialAnalysesLeft" INTEGER NOT NULL DEFAULT 5;

-- AlterTable User
ALTER TABLE "User" ADD COLUMN "managerId" TEXT;
CREATE INDEX "User_managerId_idx" ON "User"("managerId");
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable Person
ALTER TABLE "Person" ADD COLUMN "discDominant" TEXT;
ALTER TABLE "Person" ADD COLUMN "soncasDominant" TEXT;

-- AlterTable Meeting
ALTER TABLE "Meeting" ADD COLUMN "feeling" INTEGER;
ALTER TABLE "Meeting" ADD COLUMN "status" "MeetingStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Meeting" ADD COLUMN "errorMessage" TEXT;
ALTER TABLE "Meeting" ADD COLUMN "sourceType" "MeetingSourceType" NOT NULL DEFAULT 'TRANSCRIPT';
ALTER TABLE "Meeting" ADD COLUMN "sourceBlobUrl" TEXT;
CREATE INDEX "Meeting_status_idx" ON "Meeting"("status");

-- Backfill meeting status for existing rows with analyses
UPDATE "Meeting" m
SET "status" = 'READY'
WHERE EXISTS (
  SELECT 1 FROM "MeetingAnalysis" a WHERE a."meetingId" = m.id
);

-- CreateTable AnalysisJob
CREATE TABLE "AnalysisJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL DEFAULT 'analyze_meeting',
    "status" "AnalysisJobStatus" NOT NULL DEFAULT 'QUEUED',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalysisJob_status_runAfter_priority_idx" ON "AnalysisJob"("status", "runAfter", "priority");
CREATE INDEX "AnalysisJob_meetingId_idx" ON "AnalysisJob"("meetingId");
CREATE UNIQUE INDEX "AnalysisJob_meetingId_active_key" ON "AnalysisJob"("meetingId") WHERE "status" IN ('QUEUED', 'PROCESSING');

ALTER TABLE "AnalysisJob" ADD CONSTRAINT "AnalysisJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalysisJob" ADD CONSTRAINT "AnalysisJob_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable AiRequestLog
CREATE TABLE "AiRequestLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "meetingId" TEXT,
    "jobId" TEXT,
    "kind" "AiCallKind" NOT NULL,
    "status" "AiCallStatus" NOT NULL,
    "modelName" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL DEFAULT '1',
    "systemPrompt" TEXT,
    "userPrompt" TEXT,
    "rawOutput" JSONB,
    "errorMessage" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "latencyMs" INTEGER,
    "temperature" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRequestLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiRequestLog_meetingId_createdAt_idx" ON "AiRequestLog"("meetingId", "createdAt");
CREATE INDEX "AiRequestLog_status_createdAt_idx" ON "AiRequestLog"("status", "createdAt");
CREATE INDEX "AiRequestLog_createdAt_idx" ON "AiRequestLog"("createdAt");

ALTER TABLE "AiRequestLog" ADD CONSTRAINT "AiRequestLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiRequestLog" ADD CONSTRAINT "AiRequestLog_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiRequestLog" ADD CONSTRAINT "AiRequestLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "AnalysisJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable PlanRequest
CREATE TABLE "PlanRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestedById" TEXT,
    "desiredPlan" TEXT,
    "message" TEXT,
    "status" "PlanRequestStatus" NOT NULL DEFAULT 'NEW',
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlanRequest_status_createdAt_idx" ON "PlanRequest"("status", "createdAt");
CREATE INDEX "PlanRequest_organizationId_idx" ON "PlanRequest"("organizationId");

ALTER TABLE "PlanRequest" ADD CONSTRAINT "PlanRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanRequest" ADD CONSTRAINT "PlanRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable Feedback
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "userEmail" TEXT,
    "companyName" TEXT,
    "type" "FeedbackType" NOT NULL DEFAULT 'BUG',
    "message" TEXT NOT NULL,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "screenshotUrl" TEXT,
    "pageUrl" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "deviceType" TEXT,
    "viewport" TEXT,
    "screenSize" TEXT,
    "locale" TEXT,
    "appVersion" TEXT,
    "consoleErrors" JSONB,
    "extra" JSONB,
    "adminNotes" TEXT,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Feedback_status_createdAt_idx" ON "Feedback"("status", "createdAt");
CREATE INDEX "Feedback_organizationId_idx" ON "Feedback"("organizationId");

ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
CREATE INDEX "Notification_organizationId_idx" ON "Notification"("organizationId");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
