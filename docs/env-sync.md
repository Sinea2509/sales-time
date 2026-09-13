# GitHub Secrets → Vercel env sync

Production secrets are pushed to Vercel in two ways:

1. **Local (recommended for first sync):** copy [`.env.production.example`](../.env.production.example) to `.env.production`, fill values, run `npm run sync:vercel-env`.
2. **CI:** GitHub repository secrets → [Sync Vercel env](../.github/workflows/sync-vercel-env.yml) workflow (same keys as `.env.production`).

Secret values are never committed: only `.env.production.example` is tracked.

## Local sync (`.env.production`)

```bash
cp .env.production.example .env.production
# Edit .env.production with production values

vercel link   # once: supplies VERCEL_ORG_ID / VERCEL_PROJECT_ID
vercel login  # once: CLI token used when VERCEL_TOKEN is unset

npm run sync:vercel-env
```

Dry run:

```bash
DRY_RUN=1 npm run sync:vercel-env
```

Use a different file:

```bash
ENV_FILE=.env.production.staging npm run sync:vercel-env
```

### Required in `.env.production`

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Neon pooled URL |
| `DIRECT_URL` | Neon direct URL (Prisma migrate) |
| `CRON_SECRET` | `openssl rand -hex 32` |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway |
| `SUPER_ADMIN_ORG_COOKIE_SECRET` | `openssl rand -hex 32` |
| `APP_BASE_URL` | e.g. `https://sales-time-mytradeshowai.vercel.app` |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key |
| `EMAIL_FROM` | e.g. `Sales Time <onboarding@yourdomain.com>` |
| `BLOB_STORE_ID` | Vercel Blob store id (e.g. `store_…`) |
| `BLOB_READ_WRITE_TOKEN` | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) read/write token |
| `SUPERADMIN_EMAILS` | Comma-separated admin emails for plan upgrade alerts |
| `AUTH_SESSION_VERSION` | Bump on release to force re-login (or rely on deploy SHA) |

All keys in [`.github/vercel-env.manifest.json`](../.github/vercel-env.manifest.json) are required for sync.

Sync credentials (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) are read from `.env.production`, or auto-detected from `vercel login` / `vercel link` when omitted.

## GitHub Actions bootstrap

1. **Link Vercel locally** (to read IDs):
   ```bash
   vercel link
   cat .vercel/repo.json   # orgId + project id
   ```

2. **GitHub → Settings → Secrets and variables → Actions**: add the same keys as `.env.production`, plus:

   | Secret | How to obtain |
   |--------|----------------|
   | `VERCEL_TOKEN` | [Vercel account tokens](https://vercel.com/account/tokens) |
   | `VERCEL_ORG_ID` | `.vercel/repo.json` → `projects[0].orgId` |
   | `VERCEL_PROJECT_ID` | `.vercel/repo.json` → `projects[0].id` |
   | `VERCEL_DEPLOY_HOOK_URL` | Vercel project → Settings → Git → Deploy Hooks (Production) |

3. **Run the workflow**: Actions → **Sync Vercel env** → Run workflow.

   If secrets are missing, the job fails with a setup hint (empty `VERCEL_TOKEN`).

4. **Verify analysis reconciliation cron** (optional smoke test):

   ```bash
   curl -s -H "Authorization: Bearer $CRON_SECRET" \
     https://sales-time-mytradeshowai.vercel.app/api/cron/process-analysis-jobs
   ```

   Expect `{ "ok": true, ... }`, not `{ "error": "Unauthorized" }`.

   RDV create/update/retry runs analysis **in-process** via Next.js `after()`. A **daily** cron (`0 4 * * *` in `vercel.json`) runs `/api/cron/process-analysis-jobs` as a reconciliation backup for stuck or orphaned jobs.

## Rotate a secret

1. Update `.env.production` (or GitHub Secret).
2. Re-run `npm run sync:vercel-env` or the GitHub workflow.
3. Redeploy runs automatically via deploy hook when `VERCEL_DEPLOY_HOOK_URL` is set.

## Add a new variable

1. Add an entry to [`.github/vercel-env.manifest.json`](../.github/vercel-env.manifest.json) (name + targets only).
2. Add the key to [`.env.production.example`](../.env.production.example).
3. Add the matching `env:` line in [`.github/workflows/sync-vercel-env.yml`](../.github/workflows/sync-vercel-env.yml).
4. Set the value in `.env.production` and/or GitHub Secrets.
5. Sync again.

## Pull from Vercel (developers)

```bash
vercel env pull .env.local --yes
```

Sync is **one-way to Vercel**: `.env.production` / GitHub Secrets → Vercel. Local overrides stay in `.env.local`.
