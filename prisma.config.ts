// Prisma 7+: CLI (migrate, db seed, studio) uses a direct (non-pooler) URL when available.
// Vercel’s Neon integration sets DATABASE_URL_UNPOOLED; Prisma docs use DIRECT_URL.
// Runtime app uses DATABASE_URL (pooled) in lib/prisma.ts.
// See https://neon.com/docs/guides/vercel-managed-integration#environment-variables-set-by-the-integration
import "dotenv/config";
import { defineConfig } from "prisma/config";

const datasourceUrl =
  process.env["DIRECT_URL"]?.trim() ||
  process.env["DATABASE_URL_UNPOOLED"]?.trim() ||
  process.env["DATABASE_URL"]?.trim();

function migrateSubcommandNeedsAdvisoryLock(): boolean {
  const args = process.argv;
  const i = args.indexOf("migrate");
  if (i === -1) return false;
  const sub = args[i + 1];
  return (
    sub === "deploy" || sub === "dev" || sub === "reset" || sub === "resolve"
  );
}

function connectionLooksLikeNeonPooler(url: string): boolean {
  try {
    const normalized = url.replace(/^postgresql:\/\//i, "http://");
    const hostname = new URL(normalized).hostname;
    return hostname.includes("-pooler");
  } catch {
    return url.includes("-pooler");
  }
}

if (
  datasourceUrl &&
  migrateSubcommandNeedsAdvisoryLock() &&
  connectionLooksLikeNeonPooler(datasourceUrl)
) {
  throw new Error(
    [
      'Prisma Migrate cannot use Neon\'s pooled connection (hostname contains "-pooler").',
      "It will time out acquiring pg_advisory_lock (P1002).",
      "Set DIRECT_URL or DATABASE_URL_UNPOOLED (Vercel Neon integration) to the direct Postgres URL",
      '(host without "-pooler"). Keep DATABASE_URL as the pooled URL for the app.',
      "See prisma.config.ts header and https://neon.com/docs/guides/prisma",
    ].join(" "),
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl,
  },
});
