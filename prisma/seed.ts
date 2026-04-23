/**
 * Seeds default analysis prompts and optionally a local SUPER_ADMIN user.
 *
 *   DATABASE_URL=... SEED_SUPER_ADMIN_EMAIL=you@co.com SEED_SUPER_ADMIN_PASSWORD='secret' npx prisma db seed
 *
 * If `SEED_SUPER_ADMIN_EMAIL` is omitted, only prompt templates are ensured (using a throwaway author id is not possible — we require an existing user id for `authorUserId` on template versions). So: create a user first via sign-up, then set env to that email for first-time seed, or use defaults below.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import {
  DEFAULT_DISC_MARKDOWN,
  DEFAULT_SONCAS_MARKDOWN,
} from "../lib/default-analysis-prompts";
import { hashPassword } from "../lib/auth/password";

if (
  process.env.NODE_ENV === "production" &&
  process.env.ALLOW_DANGEROUS_PROD_SEED !== "1"
) {
  console.error(
    "Refusing to run prisma seed in production without ALLOW_DANGEROUS_PROD_SEED=1 (prevents accidental SUPER_ADMIN grants).",
  );
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function ensurePromptTemplates(authorUserId: string) {
  const seeds: Array<{ kind: "SONCAS" | "DISC"; markdown: string }> = [
    { kind: "SONCAS", markdown: DEFAULT_SONCAS_MARKDOWN },
    { kind: "DISC", markdown: DEFAULT_DISC_MARKDOWN },
  ];

  for (const { kind, markdown } of seeds) {
    const template = await prisma.promptTemplate.upsert({
      where: { kind },
      create: { kind },
      update: {},
    });
    if (template.currentVersionId) continue;

    const version = await prisma.promptTemplateVersion.create({
      data: {
        templateId: template.id,
        version: 1,
        markdown,
        authorUserId,
      },
    });
    await prisma.promptTemplate.update({
      where: { id: template.id },
      data: { currentVersionId: version.id },
    });
    console.log(`Seeded default ${kind} prompt template (v1).`);
  }
}

async function main() {
  const email =
    process.env.SEED_SUPER_ADMIN_EMAIL?.trim().toLowerCase() ??
    "superadmin@example.com";
  const password =
    process.env.SEED_SUPER_ADMIN_PASSWORD?.trim() ?? "DevPassword123!";

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
      },
    });
    console.log(`Created seed user ${email} (change password after first login).`);
  }

  await prisma.systemRole.upsert({
    where: {
      userId_role: { userId: user.id, role: "SUPER_ADMIN" },
    },
    create: { userId: user.id, role: "SUPER_ADMIN" },
    update: {},
  });

  await ensurePromptTemplates(user.id);

  console.log(`Super admin role ensured for user ${user.id} (${email}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
