-- AlterTable
ALTER TABLE "User" ADD COLUMN "signupWebsiteNormalized" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "websiteNormalized" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_websiteNormalized_key" ON "Organization"("websiteNormalized");
