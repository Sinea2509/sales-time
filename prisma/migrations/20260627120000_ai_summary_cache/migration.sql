-- CreateTable
CREATE TABLE "AiSummaryCache" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "meetingsFingerprint" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSummaryCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiSummaryCache_organizationId_idx" ON "AiSummaryCache"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AiSummaryCache_organizationId_scopeKey_meetingsFingerprint_key" ON "AiSummaryCache"("organizationId", "scopeKey", "meetingsFingerprint");

-- AddForeignKey
ALTER TABLE "AiSummaryCache" ADD CONSTRAINT "AiSummaryCache_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
