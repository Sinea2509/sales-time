// Prisma 7+: CLI (migrate, db seed, studio) uses this URL — Neon recommends DIRECT_URL
// (non-pooler host) for migrations. Runtime uses DATABASE_URL (pooled) in lib/prisma.ts.
// See https://neon.com/docs/guides/prisma
import "dotenv/config";
import { defineConfig } from "prisma/config";

const datasourceUrl =
  process.env["DIRECT_URL"]?.trim() || process.env["DATABASE_URL"]?.trim();

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
