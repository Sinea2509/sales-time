-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "meetingType" TEXT,
ADD COLUMN     "pipelineStage" TEXT,
ADD COLUMN     "potentialAmount" DOUBLE PRECISION;
