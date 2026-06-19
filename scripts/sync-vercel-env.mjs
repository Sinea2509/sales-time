#!/usr/bin/env node
/**
 * Upserts GitHub Actions secrets (passed as env vars) into Vercel project env.
 * See docs/env-sync.md and .github/vercel-env.manifest.json.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MANIFEST_PATH = join(ROOT, ".github/vercel-env.manifest.json");

const VERCEL_TOKEN = process.env.VERCEL_TOKEN?.trim();
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID?.trim();
const VERCEL_ORG_ID = process.env.VERCEL_ORG_ID?.trim();
const DRY_RUN = process.env.DRY_RUN === "1";
const SKIP_DEPLOY = process.env.SKIP_DEPLOY === "1";
const DEPLOY_HOOK_URL = process.env.VERCEL_DEPLOY_HOOK_URL?.trim();

function fail(message) {
  console.error(`sync-vercel-env: ${message}`);
  process.exit(1);
}

if (!VERCEL_TOKEN) fail("VERCEL_TOKEN is required");
if (!VERCEL_PROJECT_ID) fail("VERCEL_PROJECT_ID is required");
if (!VERCEL_ORG_ID) fail("VERCEL_ORG_ID is required");

/** @type {{ variables: Array<{ key: string; target: string[]; type: string; optional?: boolean }> }} */
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));

async function upsertEnvVar(entry, value) {
  const url = new URL(
    `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env`,
  );
  url.searchParams.set("upsert", "true");
  url.searchParams.set("teamId", VERCEL_ORG_ID);

  const body = {
    key: entry.key,
    value,
    type: entry.type === "plain" ? "plain" : "encrypted",
    target: entry.target,
  };

  if (DRY_RUN) {
    console.log(`[dry-run] upsert ${entry.key} → ${entry.target.join(", ")}`);
    return { ok: true };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vercel API ${res.status} for ${entry.key}: ${text}`);
  }

  return res.json();
}

async function triggerDeploy() {
  if (!DEPLOY_HOOK_URL) {
    console.log("VERCEL_DEPLOY_HOOK_URL unset — skip redeploy");
    return;
  }
  if (DRY_RUN) {
    console.log("[dry-run] trigger deploy hook");
    return;
  }
  const res = await fetch(DEPLOY_HOOK_URL, { method: "POST" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Deploy hook ${res.status}: ${text}`);
  }
  console.log("Deploy hook triggered");
}

async function main() {
  let synced = 0;
  let skipped = 0;

  for (const entry of manifest.variables) {
    const value = process.env[entry.key]?.trim();
    if (!value) {
      if (entry.optional) {
        skipped += 1;
        console.log(`skip ${entry.key} (optional, unset)`);
        continue;
      }
      fail(`missing required secret/env: ${entry.key}`);
    }

    await upsertEnvVar(entry, value);
    synced += 1;
    console.log(`synced ${entry.key}`);
  }

  console.log(`Done: ${synced} synced, ${skipped} skipped`);

  if (!SKIP_DEPLOY && synced > 0) {
    await triggerDeploy();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
