"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrgActor } from "@/lib/analysis-server-context";
import { createPlanRequest } from "@/src/core/application/create-plan-request";
import { updatePlanRequestStatus } from "@/src/core/application/update-plan-request-status";
import { getApplicationDeps } from "@/lib/application-deps";

const planRequestSchema = z.object({
  desiredPlan: z.string().trim().max(64).optional(),
  message: z.string().trim().max(2000).optional(),
});

export async function submitPlanRequestAction(
  input: z.infer<typeof planRequestSchema>,
) {
  const parsed = planRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION" as const };
  }

  const actor = await requireOrgActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };

  await createPlanRequest(actor.deps, {
    organizationId: actor.organizationId,
    requestedById: actor.actorUserId,
    desiredPlan: parsed.data.desiredPlan ?? null,
    message: parsed.data.message ?? null,
    requesterEmail: actor.email,
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
  if (!principal) {
    return { ok: false as const, error: "UNAUTHENTICATED" as const };
  }

  const user = await deps.users.findById(principal.userId);
  if (!user?.systemRoles.includes("SUPER_ADMIN")) {
    return { ok: false as const, error: "FORBIDDEN" as const };
  }

  const result = await updatePlanRequestStatus(deps, {
    id: input.id,
    status: input.status,
  });
  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  revalidatePath("/admin/plan-requests");
  if (input.status === "CONVERTED") {
    revalidatePath("/company", "layout");
  }
  return { ok: true as const };
}
