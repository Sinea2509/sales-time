/**
 * Grant system super-admin to an existing app user (matched by Clerk user id).
 *
 *   DATABASE_URL=... CLERK_USER_ID=user_xxx npx prisma db seed
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const clerkUserId = process.env.CLERK_USER_ID;
  if (!clerkUserId) {
    console.error(
      "Set CLERK_USER_ID to the Clerk user id (e.g. user_...) to seed.",
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
