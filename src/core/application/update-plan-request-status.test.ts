import { updatePlanRequestStatus } from "@/src/core/application/update-plan-request-status";
import type { OrganizationQuotaRepositoryPort } from "@/src/core/ports/organization-quota-repository-port";
import type { PlanRequestRepositoryPort } from "@/src/core/ports/plan-request-repository-port";

function createMocks() {
  const planRequests: jest.Mocked<PlanRequestRepositoryPort> = {
    create: jest.fn(),
    listByStatus: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn().mockResolvedValue(true),
  };
  const organizationQuota: jest.Mocked<OrganizationQuotaRepositoryPort> = {
    getTrialAnalysesLeft: jest.fn(),
    isPlanUnlocked: jest.fn(),
    unlockPlan: jest.fn().mockResolvedValue(undefined),
    decrementTrialAnalysesLeft: jest.fn(),
  };
  return { planRequests, organizationQuota };
}

describe("updatePlanRequestStatus", () => {
  it("returns NOT_FOUND when plan request is missing", async () => {
    const { planRequests, organizationQuota } = createMocks();
    planRequests.findById.mockResolvedValue(null);

    const result = await updatePlanRequestStatus(
      { planRequests, organizationQuota },
      { id: "pr-missing", status: "CONVERTED" },
    );

    expect(result).toEqual({ ok: false, error: "NOT_FOUND" });
    expect(planRequests.updateStatus).not.toHaveBeenCalled();
    expect(organizationQuota.unlockPlan).not.toHaveBeenCalled();
  });

  it("updates status without unlocking when not converted", async () => {
    const { planRequests, organizationQuota } = createMocks();
    planRequests.findById.mockResolvedValue({
      id: "pr1",
      organizationId: "org1",
      organizationName: "Acme",
      requestedById: null,
      requesterEmail: null,
      desiredPlan: null,
      message: null,
      status: "NEW",
      handledAt: null,
      createdAt: new Date("2026-01-01"),
    });

    const result = await updatePlanRequestStatus(
      { planRequests, organizationQuota },
      { id: "pr1", status: "CONTACTED" },
    );

    expect(result).toEqual({ ok: true });
    expect(planRequests.updateStatus).toHaveBeenCalledWith({
      id: "pr1",
      status: "CONTACTED",
    });
    expect(organizationQuota.unlockPlan).not.toHaveBeenCalled();
  });

  it("unlocks organization when status is CONVERTED", async () => {
    const { planRequests, organizationQuota } = createMocks();
    planRequests.findById.mockResolvedValue({
      id: "pr1",
      organizationId: "org1",
      organizationName: "Acme",
      requestedById: null,
      requesterEmail: null,
      desiredPlan: "Team",
      message: null,
      status: "NEW",
      handledAt: null,
      createdAt: new Date("2026-01-01"),
    });

    const result = await updatePlanRequestStatus(
      { planRequests, organizationQuota },
      { id: "pr1", status: "CONVERTED" },
    );

    expect(result).toEqual({ ok: true });
    expect(planRequests.updateStatus).toHaveBeenCalledWith({
      id: "pr1",
      status: "CONVERTED",
    });
    expect(organizationQuota.unlockPlan).toHaveBeenCalledWith("org1");
  });
});
