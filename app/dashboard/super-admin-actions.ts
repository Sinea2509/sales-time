"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
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

const reasonSchema = z
  .string()
  .trim()
  .max(500)
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const enterOrgSchema = z.object({
  targetClerkOrgId: z.string().trim().min(1).max(120),
  reason: reasonSchema,
});

const exitOrgSchema = z.object({
  clerkOrgId: z.string().trim().min(1).max(120),
  reason: reasonSchema,
});

export async function enterSuperAdminOrganizationAction(
  input: z.input<typeof enterOrgSchema>,
) {
  const parsed = enterOrgSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const deps = makeApplicationDeps();
  const result = await enterOrganizationAsSuperAdmin(deps, {
    targetClerkOrgId: parsed.data.targetClerkOrgId,
    reason: parsed.data.reason ?? null,
  });
  if (!result.ok) return result;

  const jar = await cookies();
  jar.set(
    SUPER_ADMIN_ORG_COOKIE,
    parsed.data.targetClerkOrgId,
    cookieOptions(),
  );
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/super-admin");
  return { ok: true as const };
}

export async function exitSuperAdminOrganizationAction(
  input: z.input<typeof exitOrgSchema>,
) {
  const parsed = exitOrgSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const deps = makeApplicationDeps();
  const result = await exitSuperAdminOrganizationContext(deps, {
    clerkOrgId: parsed.data.clerkOrgId,
    reason: parsed.data.reason ?? null,
  });
  if (!result.ok) return result;

  const jar = await cookies();
  jar.delete(SUPER_ADMIN_ORG_COOKIE);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/super-admin");
  return { ok: true as const };
}
