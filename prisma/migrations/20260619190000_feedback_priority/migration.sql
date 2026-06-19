-- CreateEnum
CREATE TYPE "FeedbackPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN "priority" "FeedbackPriority" NOT NULL DEFAULT 'MEDIUM';

-- CreateIndex
CREATE INDEX "Feedback_priority_createdAt_idx" ON "Feedback"("priority", "createdAt");
