-- CreateTable
CREATE TABLE "OnboardingProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
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
    "inviteEmails" JSONB,
    "inviteMessage" TEXT,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProfile_userId_key" ON "OnboardingProfile"("userId");

-- AddForeignKey
ALTER TABLE "OnboardingProfile" ADD CONSTRAINT "OnboardingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
