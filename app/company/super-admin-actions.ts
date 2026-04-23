"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { enterOrganizationAsSuperAdmin } from "@/src/core/application/enter-organization-as-super-admin";
import { exitSuperAdminOrganizationContext } from "@/src/core/application/exit-super-admin-organization-context";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { signSuperAdminOrgCookieValue } from "@/lib/super-admin-org-cookie-crypto";
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
  targetOrganizationId: z.string().trim().min(1).max(120),
  reason: reasonSchema,
});

/** `organizationId` is optional for clients; server uses the verified cookie org for audit. */
const exitOrgSchema = z.object({
  organizationId: z.string().trim().min(1).max(120).optional(),
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
  const result = await enterOrganizationAsSuperAdmin(
    {
      auth: deps.auth,
      audit: deps.audit,
      orgDirectory: deps.orgDirectory,
    },
    {
      targetOrganizationId: parsed.data.targetOrganizationId,
      reason: parsed.data.reason ?? null,
    },
  );
  if (!result.ok) return result;

  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    return { ok: false as const, error: "NOT_AUTHENTICATED" as const };
  }

  const jar = await cookies();
  jar.set(
    SUPER_ADMIN_ORG_COOKIE,
    signSuperAdminOrgCookieValue({
      actorUserId: principal.userId,
      targetOrganizationId: parsed.data.targetOrganizationId,
      maxAgeSec: cookieOptions().maxAge,
    }),
    cookieOptions(),
  );
  revalidatePath("/company");
  revalidatePath("/admin");
  redirect("/company");
}

export async function exitSuperAdminOrganizationAction(
  input: z.input<typeof exitOrgSchema>,
) {
  const parsed = exitOrgSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION" };
  }

  const verifiedOrg = await readSuperAdminOrgCookie();
  if (!verifiedOrg) {
    return { ok: false as const, error: "NO_ELEVATION" as const };
  }
  if (
    parsed.data.organizationId !== undefined &&
    parsed.data.organizationId !== verifiedOrg
  ) {
    return { ok: false as const, error: "ORG_MISMATCH" as const };
  }

  const deps = makeApplicationDeps();
  const result = await exitSuperAdminOrganizationContext(
    { auth: deps.auth, audit: deps.audit },
    {
      organizationId: verifiedOrg,
      reason: parsed.data.reason ?? null,
    },
  );
  if (!result.ok) return result;

  const jar = await cookies();
  jar.delete(SUPER_ADMIN_ORG_COOKIE);
  revalidatePath("/company");
  revalidatePath("/admin");
  redirect("/company");
}
