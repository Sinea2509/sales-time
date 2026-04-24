/**
 * Seeds default analysis prompts and a SUPER_ADMIN user (defaults below).
 *
 *   DATABASE_URL=... npx prisma db seed
 *
 * Override with `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD`.
 * To reset the password for an existing seed user (dev/staging only):
 *   SEED_SUPER_ADMIN_RESET_PASSWORD=1 npx prisma db seed
 *
 * Production refuses to run unless `ALLOW_DANGEROUS_PROD_SEED=1`.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import {
  DEFAULT_DISC_MARKDOWN,
  DEFAULT_KISS_MARKDOWN,
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
  const seeds: Array<{ kind: "SONCAS" | "DISC" | "KISS"; markdown: string }> = [
    { kind: "SONCAS", markdown: DEFAULT_SONCAS_MARKDOWN },
    { kind: "DISC", markdown: DEFAULT_DISC_MARKDOWN },
    { kind: "KISS", markdown: DEFAULT_KISS_MARKDOWN },
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
    "stephane@mytradeshow.ai";
  const password =
    process.env.SEED_SUPER_ADMIN_PASSWORD?.trim() ??
    "MyTradeshow2026!SuperAdmin";

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
      },
    });
    console.log(`Created seed user ${email} (change password after first login).`);
  } else if (
    process.env.SEED_SUPER_ADMIN_RESET_PASSWORD === "1" &&
    (process.env.NODE_ENV !== "production" ||
      process.env.ALLOW_DANGEROUS_PROD_SEED === "1")
  ) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    });
    console.log(
      `Updated password for existing user ${email} (SEED_SUPER_ADMIN_RESET_PASSWORD=1).`,
    );
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
