-- Quinze analyses gratuites au lieu de cinq. Les organisations encore en essai en gagnent dix.
ALTER TABLE "Organization" ALTER COLUMN "trialAnalysesLeft" SET DEFAULT 15;
UPDATE "Organization" SET "trialAnalysesLeft" = "trialAnalysesLeft" + 10 WHERE "planUnlockedAt" IS NULL;
