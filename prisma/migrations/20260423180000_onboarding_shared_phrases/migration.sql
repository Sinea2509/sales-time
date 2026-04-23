-- CreateEnum
CREATE TYPE "OnboardingSharedPhraseKind" AS ENUM ('OBJECTION', 'ARGUMENT');

-- CreateTable
CREATE TABLE "OnboardingSharedPhrase" (
    "id" TEXT NOT NULL,
    "kind" "OnboardingSharedPhraseKind" NOT NULL,
    "text" VARCHAR(500) NOT NULL,
    "normalizedText" VARCHAR(500) NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingSharedPhrase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingSharedPhrase_kind_normalizedText_key" ON "OnboardingSharedPhrase"("kind", "normalizedText");

-- CreateIndex
CREATE INDEX "OnboardingSharedPhrase_kind_createdAt_idx" ON "OnboardingSharedPhrase"("kind", "createdAt");

-- AddForeignKey
ALTER TABLE "OnboardingSharedPhrase" ADD CONSTRAINT "OnboardingSharedPhrase_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
