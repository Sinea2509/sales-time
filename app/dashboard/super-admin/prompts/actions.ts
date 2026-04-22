"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { ensureClerkUserSynced } from "@/src/adapters/prisma/sync-clerk-user";
import { publishGlobalPromptVersion } from "@/src/core/application/publish-global-prompt-version";
import type { AnalysisKindSlug } from "@/src/core/ports/prompt-template-repository-port";

export async function publishPromptAction(input: {
  kind: AnalysisKindSlug;
  markdown: string;
  auditAction: "PUBLISH_PROMPT" | "RESTORE_PROMPT";
}) {
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
    kind: input.kind,
    markdown: input.markdown,
    auditAction: input.auditAction,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  revalidatePath("/dashboard/super-admin/prompts");
  return { ok: true as const, version: result.version };
}
