# GitHub Secrets → Vercel env sync

Production secrets live in **GitHub repository secrets** and are pushed to Vercel by the [Sync Vercel env](../.github/workflows/sync-vercel-env.yml) workflow. Secret values are never committed to the repo.

## One-time bootstrap

1. **Link Vercel locally** (optional, to read IDs):
   ```bash
   vercel link
   cat .vercel/project.json   # orgId + projectId
   ```

2. **GitHub → Settings → Secrets and variables → Actions** — add:

   | Secret | How to obtain |
   |--------|----------------|
   | `VERCEL_TOKEN` | [Vercel account tokens](https://vercel.com/account/tokens) |
   | `VERCEL_ORG_ID` | `.vercel/project.json` → `orgId` |
   | `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` |
   | `VERCEL_DEPLOY_HOOK_URL` | Vercel project → Settings → Git → Deploy Hooks (Production) |
   | `CRON_SECRET` | `openssl rand -hex 32` |
   | `AI_GATEWAY_API_KEY` | Vercel AI Gateway dashboard |
   | `SUPER_ADMIN_ORG_COOKIE_SECRET` | `openssl rand -hex 32` |
   | `APP_BASE_URL` | e.g. `https://sales-time.vercel.app` |
   | `DATABASE_URL` | Neon / Vercel integration (skip if marketplace-managed) |

   See [`.env.example`](../.env.example) for optional keys (`RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, …).

3. **Run the workflow**: Actions → **Sync Vercel env** → Run workflow.

4. **Verify cron worker**:
   ```bash
   curl -s -H "Authorization: Bearer $CRON_SECRET" \
     https://sales-time.vercel.app/api/worker/process-jobs
   ```
   Expect `{ "ok": true, ... }`, not `{ "error": "Unauthorized" }`.

## Rotate a secret

1. Update the value in GitHub Secrets.
2. Re-run **Sync Vercel env** (workflow_dispatch).
3. Redeploy runs automatically via deploy hook when vars were synced.

## Add a new variable

1. Add an entry to [`.github/vercel-env.manifest.json`](../.github/vercel-env.manifest.json) (name + targets only).
2. Add the matching `env:` line in [`.github/workflows/sync-vercel-env.yml`](../.github/workflows/sync-vercel-env.yml).
3. Create the GitHub Secret with the same name.
4. Run the sync workflow.

## Local development

Developers pull Vercel env into `.env.local`:

```bash
vercel env pull .env.local --yes
```

Sync is **one-way**: GitHub → Vercel. Local overrides stay in `.env.local`.

## Dry run (maintainers)

```bash
DRY_RUN=1 VERCEL_TOKEN=... VERCEL_ORG_ID=... VERCEL_PROJECT_ID=... \
  CRON_SECRET=test node scripts/sync-vercel-env.mjs
```
