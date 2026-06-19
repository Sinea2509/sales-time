#!/usr/bin/env node
/**
 * Upserts env vars into Vercel project env.
 * Local: loads `.env.production` (or ENV_FILE), Vercel link IDs, and CLI token.
 * CI: values come from GitHub Actions secrets via process.env.
 * See docs/env-sync.md and .github/vercel-env.manifest.json.
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MANIFEST_PATH = join(ROOT, ".github/vercel-env.manifest.json");
const DEFAULT_ENV_FILE = join(ROOT, ".env.production");

function fail(message) {
  console.error(`sync-vercel-env: ${message}`);
  process.exit(1);
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

/** @param {string} filePath */
function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return false;

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    const rawValue = trimmed.slice(eq + 1).trim();
    if (!key || process.env[key] !== undefined) continue;

    process.env[key] = stripQuotes(rawValue);
  }

  console.log(`loaded ${filePath}`);
  return true;
}

function loadVercelProjectFromLink() {
  const projectJsonPath = join(ROOT, ".vercel/project.json");
  if (existsSync(projectJsonPath)) {
    const project = JSON.parse(readFileSync(projectJsonPath, "utf8"));
    if (!process.env.VERCEL_ORG_ID && project.orgId) {
      process.env.VERCEL_ORG_ID = project.orgId;
    }
    if (!process.env.VERCEL_PROJECT_ID && project.projectId) {
      process.env.VERCEL_PROJECT_ID = project.projectId;
    }
    return;
  }

  const repoJsonPath = join(ROOT, ".vercel/repo.json");
  if (!existsSync(repoJsonPath)) return;

  const repo = JSON.parse(readFileSync(repoJsonPath, "utf8"));
  const linked = repo.projects?.find((p) => p.name === "sales-time") ?? repo.projects?.[0];
  if (!linked) return;

  if (!process.env.VERCEL_ORG_ID && linked.orgId) {
    process.env.VERCEL_ORG_ID = linked.orgId;
  }
  if (!process.env.VERCEL_PROJECT_ID && linked.id) {
    process.env.VERCEL_PROJECT_ID = linked.id;
  }
}

function loadVercelCliToken() {
  if (process.env.CI || process.env.VERCEL_TOKEN) return;

  const authPath = join(
    process.env.XDG_DATA_HOME ?? join(homedir(), ".local/share"),
    "com.vercel.cli/auth.json",
  );
  if (!existsSync(authPath)) return;

  const auth = JSON.parse(readFileSync(authPath, "utf8"));
  if (typeof auth.token === "string" && auth.token.trim()) {
    process.env.VERCEL_TOKEN = auth.token.trim();
    console.log("using Vercel CLI auth token");
  }
}

const envFile = process.env.ENV_FILE?.trim() || DEFAULT_ENV_FILE;
loadEnvFile(envFile);
loadVercelProjectFromLink();
loadVercelCliToken();

const VERCEL_TOKEN = process.env.VERCEL_TOKEN?.trim();
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID?.trim();
const VERCEL_ORG_ID = process.env.VERCEL_ORG_ID?.trim();
const DRY_RUN = process.env.DRY_RUN === "1";
const SKIP_DEPLOY = process.env.SKIP_DEPLOY === "1";
const DEPLOY_HOOK_URL = process.env.VERCEL_DEPLOY_HOOK_URL?.trim();

if (!VERCEL_TOKEN) {
  fail(
    "VERCEL_TOKEN is required — set it in .env.production, export it, or run `vercel login`",
  );
}
if (!VERCEL_PROJECT_ID) {
  fail("VERCEL_PROJECT_ID is required — run `vercel link` in this repo");
}
if (!VERCEL_ORG_ID) {
  fail("VERCEL_ORG_ID is required — run `vercel link` in this repo");
}

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
  if (!existsSync(envFile) && process.env.CI) {
    fail(
      "GitHub Actions secrets are empty — add VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, and app secrets (see docs/env-sync.md)",
    );
  }

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
      fail(
        `missing required value: ${entry.key} — set it in .env.production or GitHub Secrets`,
      );
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
