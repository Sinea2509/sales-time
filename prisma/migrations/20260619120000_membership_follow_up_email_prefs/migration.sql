-- Per-member follow-up email overrides within an organization tenant.
ALTER TABLE "OrganizationMembership"
ADD COLUMN "followUpEmailTone" TEXT,
ADD COLUMN "followUpEmailVouvoiement" BOOLEAN,
ADD COLUMN "followUpEmailSignature" TEXT;
