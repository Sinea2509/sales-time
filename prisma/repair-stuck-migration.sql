-- Recovery before `prisma migrate deploy` on Neon/Vercel:
-- 1) Remove orphaned failed row for renamed init migration (P3009).
-- 2) Legacy SuperAdminAuditLog without organizationId (IF NOT EXISTS skips CREATE TABLE).
-- 3) Legacy Meeting: superseded org foreign-key column vs organizationId (same IF NOT EXISTS issue).
--    Only drops Meeting when it is empty; otherwise fix data manually or use a fresh Neon branch.

DO $$
BEGIN
  DELETE FROM public."_prisma_migrations"
  WHERE migration_name = '20260425120000_init_sales_time';

  -- Failed init retry (e.g. P3018 after missing column); do not remove successful rows.
  DELETE FROM public."_prisma_migrations"
  WHERE migration_name = '20260420100000_init_sales_time'
    AND logs IS NOT NULL
    AND (
      logs ILIKE '%42703%'
      OR logs ILIKE '%does not exist%'
      OR logs ILIKE '%P3018%'
    );
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public."SuperAdminAuditLog"
    ADD COLUMN IF NOT EXISTS "organizationId" TEXT NOT NULL DEFAULT '';
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

DO $$
DECLARE
  meeting_cnt bigint;
BEGIN
  IF to_regclass('public."Meeting"') IS NULL THEN
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Meeting'
      AND column_name = 'clerkOrgId'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Meeting'
      AND column_name = 'organizationId'
  ) THEN
    SELECT COUNT(*) INTO meeting_cnt FROM public."Meeting";
    IF meeting_cnt = 0 THEN
      DROP TABLE public."Meeting" CASCADE;
    END IF;
  END IF;
END $$;
