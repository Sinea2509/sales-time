"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { createPlanRequest } from "@/src/core/application/create-plan-request";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";

const planRequestSchema = z.object({
  desiredPlan: z.string().trim().max(64).optional(),
  message: z.string().trim().max(2000).optional(),
});

export async function submitPlanRequestAction(
  input: z.infer<typeof planRequestSchema>,
) {
  const parsed = planRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };

  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const };

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevation: superAdminOrg },
  );
  if (ctx.kind !== "authenticated" || !ctx.activeOrganizationId) {
    return { ok: false as const };
  }

  await createPlanRequest(deps, {
    organizationId: ctx.activeOrganizationId,
    requestedById: principal.userId,
    desiredPlan: parsed.data.desiredPlan ?? null,
    message: parsed.data.message ?? null,
    requesterEmail: ctx.email,
  });

  revalidatePath("/company/plan");
  return { ok: true as const };
}

export async function updatePlanRequestStatusAction(input: {
  id: string;
  status: "NEW" | "CONTACTED" | "CONVERTED" | "DISMISSED";
}) {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const };

  const user = await deps.users.findById(principal.userId);
  if (!user?.systemRoles.includes("SUPER_ADMIN")) {
    return { ok: false as const };
  }

  await deps.planRequests.updateStatus({
    id: input.id,
    status: input.status,
  });

  revalidatePath("/admin/plan-requests");
  return { ok: true as const };
}
