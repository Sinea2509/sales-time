import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/** Upsert app `User` from Clerk (dev convenience when webhooks are not configured). */
export async function ensureClerkUserSynced(clerkUserId: string): Promise<void> {
  const client = await clerkClient();
  const u = await client.users.getUser(clerkUserId);
  const primary =
    u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)
      ?.emailAddress ?? u.emailAddresses[0]?.emailAddress;

  await prisma.user.upsert({
    where: { clerkUserId: u.id },
    create: { clerkUserId: u.id, email: primary ?? null },
    update: { email: primary ?? undefined },
  });
}
