"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { ensureClerkUserSynced } from "@/src/adapters/prisma/sync-clerk-user";
import { publishGlobalPromptVersion } from "@/src/core/application/publish-global-prompt-version";

const publishPromptSchema = z.object({
  kind: z.enum(["SONCAS", "DISC"]),
  markdown: z.string().min(1).max(200_000),
  auditAction: z.enum(["PUBLISH_PROMPT", "RESTORE_PROMPT"]),
});

export type PublishPromptInput = z.input<typeof publishPromptSchema>;

export async function publishPromptAction(input: PublishPromptInput) {
  const parsed = publishPromptSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: "UNAUTHENTICATED" };

  await ensureClerkUserSynced(userId);
  const userRow = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { systemRoles: true },
  });
  if (!userRow) return { ok: false as const, error: "NO_USER" };

  const isSuperAdmin = userRow.systemRoles.some((r) => r.role === "SUPER_ADMIN");
  const deps = makeApplicationDeps();
  const result = await publishGlobalPromptVersion(deps, {
    actorInternalUserId: userRow.id,
    isSuperAdmin,
    kind: parsed.data.kind,
    markdown: parsed.data.markdown,
    auditAction: parsed.data.auditAction,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  revalidatePath("/dashboard/super-admin/prompts");
  return { ok: true as const, version: result.version };
}
