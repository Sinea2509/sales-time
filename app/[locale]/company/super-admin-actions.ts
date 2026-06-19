"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { shouldUseSecureSessionCookies } from "@/lib/auth/session-cookie";
import { z } from "zod";
import { getApplicationDeps } from "@/lib/application-deps";
import { enterOrganizationAsSuperAdmin } from "@/src/core/application/enter-organization-as-super-admin";
import { exitSuperAdminOrganizationContext } from "@/src/core/application/exit-super-admin-organization-context";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { signSuperAdminOrgCookieValue } from "@/lib/super-admin-org-cookie-crypto";
import { SUPER_ADMIN_ORG_COOKIE } from "@/lib/super-admin-cookie";

function cookieOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: shouldUseSecureSessionCookies(),
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

import type { OrganizationMembershipRole } from "@/src/core/domain/organization-membership-role";
import { organizationMembershipRoleLabel } from "@/src/core/domain/organization-membership-role";

const enterOrgSchema = z.object({
  targetOrganizationId: z.string().trim().min(1).max(120),
  role: z.enum(["ADMIN", "MEMBER"]),
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

  const deps = getApplicationDeps();
  const role: OrganizationMembershipRole = parsed.data.role;
  const auditReason = [
    parsed.data.reason,
    `Rôle : ${organizationMembershipRoleLabel(role)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const result = await enterOrganizationAsSuperAdmin(
    {
      auth: deps.auth,
      audit: deps.audit,
      orgDirectory: deps.orgDirectory,
    },
    {
      targetOrganizationId: parsed.data.targetOrganizationId,
      reason: auditReason || null,
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
      role,
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

  const verifiedElevation = await readSuperAdminOrgCookie();
  if (!verifiedElevation) {
    return { ok: false as const, error: "NO_ELEVATION" as const };
  }
  if (
    parsed.data.organizationId !== undefined &&
    parsed.data.organizationId !== verifiedElevation.organizationId
  ) {
    return { ok: false as const, error: "ORG_MISMATCH" as const };
  }

  const deps = getApplicationDeps();
  const result = await exitSuperAdminOrganizationContext(
    { auth: deps.auth, audit: deps.audit },
    {
      organizationId: verifiedElevation.organizationId,
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
