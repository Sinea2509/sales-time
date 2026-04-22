/**
 * Grant system super-admin to an existing Clerk user (must already exist in Clerk).
 *
 * By Clerk user id:
 *   DATABASE_URL=... CLERK_USER_ID=user_xxx npx prisma db seed
 *
 * By primary email (needs CLERK_SECRET_KEY in env, same as .env for the app):
 *   DATABASE_URL=... CLERK_EMAIL=you@company.com npx prisma db seed
 */
import { clerkClient } from "@clerk/nextjs/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import {
  DEFAULT_DISC_MARKDOWN,
  DEFAULT_SONCAS_MARKDOWN,
} from "../lib/default-analysis-prompts";

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

async function resolveClerkUserIdFromEmail(email: string): Promise<string> {
  const client = await clerkClient();
  const { data } = await client.users.getUserList({
    emailAddress: [email.trim().toLowerCase()],
    limit: 5,
  });
  if (data.length === 0) {
    throw new Error(
      `No Clerk user found for email "${email}". Create the user in Clerk first (sign-up or Dashboard → Users), then re-run seed.`,
    );
  }
  if (data.length > 1) {
    console.warn(
      `Multiple Clerk users share that email; using the first match: ${data[0]!.id}`,
    );
  }
  return data[0]!.id;
}

async function main() {
  let clerkUserId = process.env.CLERK_USER_ID?.trim();
  const clerkEmail = process.env.CLERK_EMAIL?.trim();

  if (!clerkUserId && clerkEmail) {
    if (!process.env.CLERK_SECRET_KEY) {
      console.error(
        "CLERK_EMAIL requires CLERK_SECRET_KEY in the environment (same key as the Next.js app).",
      );
      process.exit(1);
    }
    clerkUserId = await resolveClerkUserIdFromEmail(clerkEmail);
    console.log(`Resolved CLERK_EMAIL ${clerkEmail} → ${clerkUserId}`);
  }

  if (!clerkUserId) {
    console.error(
      "Set CLERK_USER_ID (e.g. user_...) or CLERK_EMAIL (e.g. you@company.com) to seed.",
    );
    process.exit(1);
  }

  const user = await prisma.user.upsert({
    where: { clerkUserId },
    create: { clerkUserId, email: null },
    update: {},
  });

  await prisma.systemRole.upsert({
    where: {
      userId_role: { userId: user.id, role: "SUPER_ADMIN" },
    },
    create: { userId: user.id, role: "SUPER_ADMIN" },
    update: {},
  });

  await ensurePromptTemplates(user.id);

  console.log(`Super admin role ensured for user ${user.id} (${clerkUserId}).`);
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
