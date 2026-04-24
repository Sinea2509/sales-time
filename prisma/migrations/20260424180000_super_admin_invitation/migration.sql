-- CreateEnum (idempotent)
DO $$ BEGIN CREATE TYPE "SuperAdminInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "SuperAdminInvitation" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "SuperAdminInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedByUserId" TEXT NOT NULL,
    "acceptedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuperAdminInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SuperAdminInvitation_tokenHash_key" ON "SuperAdminInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SuperAdminInvitation_email_idx" ON "SuperAdminInvitation"("email");

-- AddForeignKey (idempotent)
DO $$ BEGIN ALTER TABLE "SuperAdminInvitation" ADD CONSTRAINT "SuperAdminInvitation_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "SuperAdminInvitation" ADD CONSTRAINT "SuperAdminInvitation_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
