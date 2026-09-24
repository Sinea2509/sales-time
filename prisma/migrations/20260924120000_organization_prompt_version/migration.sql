-- Lot 80b : les consignes par organisation (Paramètres, Coach IA).
-- Une table où chaque enregistrement et chaque réinitialisation d'un manager
-- ajoutent une ligne, et une colonne facultative sur MeetingAnalysis pour
-- savoir après coup quelle consigne a produit une analyse. Migration
-- additive : la version en ligne ignore la table et la colonne.

-- AlterTable
ALTER TABLE "MeetingAnalysis" ADD COLUMN     "organizationPromptVersionId" TEXT;

-- CreateTable
CREATE TABLE "OrganizationPromptVersion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "kind" "AnalysisKind" NOT NULL,
    "markdown" TEXT,
    "authorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationPromptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganizationPromptVersion_organizationId_kind_createdAt_idx" ON "OrganizationPromptVersion"("organizationId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "MeetingAnalysis_organizationPromptVersionId_idx" ON "MeetingAnalysis"("organizationPromptVersionId");

-- AddForeignKey
ALTER TABLE "MeetingAnalysis" ADD CONSTRAINT "MeetingAnalysis_organizationPromptVersionId_fkey" FOREIGN KEY ("organizationPromptVersionId") REFERENCES "OrganizationPromptVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationPromptVersion" ADD CONSTRAINT "OrganizationPromptVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationPromptVersion" ADD CONSTRAINT "OrganizationPromptVersion_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
