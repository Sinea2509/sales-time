-- CreateTable
CREATE TABLE "OrganizationSettings" (
    "id" TEXT NOT NULL,
    "clerkOrgId" TEXT NOT NULL,
    "companyName" TEXT,
    "industrySector" TEXT,
    "commercialTeamSize" TEXT,
    "averageSalesCycle" TEXT,
    "averageDealSize" TEXT,
    "companyPitch" TEXT,
    "objections" JSONB,
    "keyArguments" JSONB,
    "industryVocabulary" TEXT,
    "meetingTypes" JSONB,
    "pipelineStages" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSettings_clerkOrgId_key" ON "OrganizationSettings"("clerkOrgId");
