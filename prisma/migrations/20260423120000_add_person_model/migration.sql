-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "clerkOrgId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "normalizedKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_clerkOrgId_normalizedKey_key" ON "Person"("clerkOrgId", "normalizedKey");

-- CreateIndex
CREATE INDEX "Person_clerkOrgId_idx" ON "Person"("clerkOrgId");

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN "personId" TEXT;

-- Backfill Person rows from existing meetings (one per org + normalized name)
INSERT INTO "Person" ("id", "clerkOrgId", "displayName", "normalizedKey", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text,
       d."clerkOrgId",
       d."displayName",
       d."normalizedKey",
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT ON (m."clerkOrgId", lower(regexp_replace(trim(m."prospectName"), '\s+', ' ', 'g')))
        m."clerkOrgId",
        trim(m."prospectName") AS "displayName",
        lower(regexp_replace(trim(m."prospectName"), '\s+', ' ', 'g')) AS "normalizedKey"
    FROM "Meeting" m
    ORDER BY m."clerkOrgId", lower(regexp_replace(trim(m."prospectName"), '\s+', ' ', 'g')), m."prospectName"
) d;

-- Link meetings to persons
UPDATE "Meeting" m
SET "personId" = p."id"
FROM "Person" p
WHERE m."clerkOrgId" = p."clerkOrgId"
  AND lower(regexp_replace(trim(m."prospectName"), '\s+', ' ', 'g')) = p."normalizedKey";

-- AlterTable (enforce NOT NULL after backfill)
ALTER TABLE "Meeting" ALTER COLUMN "personId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Meeting_personId_idx" ON "Meeting"("personId");

-- CreateIndex
CREATE INDEX "Meeting_clerkOrgId_sellerUserId_idx" ON "Meeting"("clerkOrgId", "sellerUserId");

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
