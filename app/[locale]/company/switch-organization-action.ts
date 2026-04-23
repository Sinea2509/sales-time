"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { setActiveOrganizationCookie } from "@/lib/auth/session-cookie";
import { prisma } from "@/lib/prisma";
import { makeApplicationDeps } from "@/src/adapters/composition";

const idSchema = z.string().trim().min(1).max(120);

export async function switchOrganizationAction(
  organizationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = idSchema.safeParse(organizationId);
  if (!parsed.success) {
    return { ok: false, error: "INVALID" };
  }

  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  const id = parsed.data;
  const isMember = principal.memberships.some((m) => m.organizationId === id);
  const isSuper = principal.systemRoles.includes("SUPER_ADMIN");
  if (!isMember) {
    if (!isSuper) {
      return { ok: false, error: "FORBIDDEN" };
    }
    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) {
      return { ok: false, error: "NOT_FOUND" };
    }
  }

  await setActiveOrganizationCookie(id);
  revalidatePath("/company", "layout");
  return { ok: true };
}
