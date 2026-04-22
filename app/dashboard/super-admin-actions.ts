"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { enterOrganizationAsSuperAdmin } from "@/src/core/application/enter-organization-as-super-admin";
import { exitSuperAdminOrganizationContext } from "@/src/core/application/exit-super-admin-organization-context";
import { SUPER_ADMIN_ORG_COOKIE } from "@/lib/super-admin-cookie";

function cookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  };
}

export async function enterSuperAdminOrganizationAction(input: {
  targetClerkOrgId: string;
  reason?: string | null;
}) {
  const deps = makeApplicationDeps();
  const result = await enterOrganizationAsSuperAdmin(deps, {
    targetClerkOrgId: input.targetClerkOrgId,
    reason: input.reason,
  });
  if (!result.ok) return result;

  const jar = await cookies();
  jar.set(SUPER_ADMIN_ORG_COOKIE, input.targetClerkOrgId, cookieOptions());
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/super-admin");
  return { ok: true as const };
}

export async function exitSuperAdminOrganizationAction(input: {
  clerkOrgId: string;
  reason?: string | null;
}) {
  const deps = makeApplicationDeps();
  const result = await exitSuperAdminOrganizationContext(deps, {
    clerkOrgId: input.clerkOrgId,
    reason: input.reason,
  });
  if (!result.ok) return result;

  const jar = await cookies();
  jar.delete(SUPER_ADMIN_ORG_COOKIE);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/super-admin");
  return { ok: true as const };
}
