import type { OrganizationQuotaRepositoryPort } from "@/src/core/ports/organization-quota-repository-port";
import type {
  PlanRequestRepositoryPort,
  PlanRequestStatus,
} from "@/src/core/ports/plan-request-repository-port";

export type UpdatePlanRequestStatusResult =
  | { ok: true }
  | { ok: false; error: "NOT_FOUND" };

export async function updatePlanRequestStatus(
  deps: {
    planRequests: PlanRequestRepositoryPort;
    organizationQuota: OrganizationQuotaRepositoryPort;
  },
  input: {
    id: string;
    status: PlanRequestStatus;
  },
): Promise<UpdatePlanRequestStatusResult> {
  const planRequest = await deps.planRequests.findById(input.id);
  if (!planRequest) {
    return { ok: false, error: "NOT_FOUND" };
  }

  await deps.planRequests.updateStatus({
    id: input.id,
    status: input.status,
  });

  if (input.status === "CONVERTED") {
    await deps.organizationQuota.unlockPlan(planRequest.organizationId);
  }

  return { ok: true };
}
