-- Qui a créé le contact, pour qu'un commercial ne voie que ses contacts (29 octobre 2026).
ALTER TABLE "Person" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;
