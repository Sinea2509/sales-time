-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "followUpEmailDraft" TEXT;

-- AlterTable
ALTER TABLE "OrganizationSettings" ADD COLUMN     "emailTone" TEXT,
ADD COLUMN     "emailVouvoiement" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailSignature" TEXT;
