import { beforeEach, describe, expect, it } from "@jest/globals";

type JestFn = jest.Mock;

const ORG_ID = "clorg00000000000000000001";
const USER_ID = "cmfq0w5vq0001s6z8v9x0y1z2";

// eslint-disable-next-line no-var
var revalidatePathMock: JestFn;
jest.mock("next/cache", () => {
  revalidatePathMock = jest.fn();
  return { revalidatePath: revalidatePathMock };
});

// eslint-disable-next-line no-var
var setActiveOrganizationCookieMock: JestFn;
jest.mock("@/lib/auth/session-cookie", () => {
  setActiveOrganizationCookieMock = jest.fn().mockResolvedValue(undefined);
  return { setActiveOrganizationCookie: setActiveOrganizationCookieMock };
});

// eslint-disable-next-line no-var
var readSuperAdminOrgCookieMock: JestFn;
jest.mock("@/lib/read-super-admin-org-cookie", () => {
  readSuperAdminOrgCookieMock = jest.fn().mockResolvedValue(null);
  return { readSuperAdminOrgCookie: readSuperAdminOrgCookieMock };
});

// eslint-disable-next-line no-var
var getCurrentActorContextMock: JestFn;
jest.mock("@/src/core/application/get-current-actor-context", () => {
  getCurrentActorContextMock = jest.fn();
  return { getCurrentActorContext: getCurrentActorContextMock };
});

// eslint-disable-next-line no-var
var createPlanRequestMock: JestFn;
jest.mock("@/src/core/application/create-plan-request", () => {
  createPlanRequestMock = jest.fn().mockResolvedValue(undefined);
  return { createPlanRequest: createPlanRequestMock };
});

type CompanyDepsMocks = {
  getAuthenticatedPrincipalMock: JestFn;
  findByIdMock: JestFn;
  notificationsMock: Record<string, JestFn>;
  orgDirectoryMock: Record<string, JestFn>;
  planRequestsMock: Record<string, JestFn>;
};

jest.mock("@/lib/application-deps", () => {
  const mocks: CompanyDepsMocks = {
    getAuthenticatedPrincipalMock: jest.fn(),
    findByIdMock: jest.fn(),
    notificationsMock: {
      markRead: jest.fn().mockResolvedValue(undefined),
      markAllRead: jest.fn().mockResolvedValue(undefined),
    },
    orgDirectoryMock: {
      getOrganizationById: jest.fn(),
    },
    planRequestsMock: {
      updateStatus: jest.fn().mockResolvedValue(undefined),
    },
  };
  const graph = {
    auth: { getAuthenticatedPrincipal: mocks.getAuthenticatedPrincipalMock },
    users: { findById: mocks.findByIdMock },
    notifications: mocks.notificationsMock,
    orgDirectory: mocks.orgDirectoryMock,
    planRequests: mocks.planRequestsMock,
  };
  (graph as { __companyTestMocks?: CompanyDepsMocks }).__companyTestMocks =
    mocks;
  return { getApplicationDeps: () => graph };
});

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/[locale]/company/notification-actions";
import { exampleOrgAdminOnlyAction } from "@/app/[locale]/company/org-demo-actions";
import {
  submitPlanRequestAction,
  updatePlanRequestStatusAction,
} from "@/app/[locale]/company/plan-actions";
import { switchOrganizationAction } from "@/app/[locale]/company/switch-organization-action";
import { getApplicationDeps } from "@/lib/application-deps";

const {
  getAuthenticatedPrincipalMock,
  findByIdMock,
  notificationsMock,
  orgDirectoryMock,
  planRequestsMock,
} = (getApplicationDeps() as unknown as { __companyTestMocks: CompanyDepsMocks })
  .__companyTestMocks;

function mockOrgAdminPrincipal() {
  getAuthenticatedPrincipalMock.mockResolvedValue({
    userId: USER_ID,
    email: "admin@test.com",
    firstName: "Ada",
    lastName: "Min",
    memberships: [{ organizationId: ORG_ID, role: "ADMIN" }],
    activeOrganizationIdFromCookie: ORG_ID,
    systemRoles: [],
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  readSuperAdminOrgCookieMock.mockResolvedValue(null);
  getCurrentActorContextMock.mockResolvedValue({
    kind: "authenticated",
    userId: USER_ID,
    email: "admin@test.com",
    activeOrganizationId: ORG_ID,
    canManageOrganization: true,
    workspaceRoleMode: "admin",
    systemRoles: [],
  });
  mockOrgAdminPrincipal();
});

describe("company core actions", () => {
  it("markNotificationReadAction rejects guests", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    await expect(markNotificationReadAction("n1")).resolves.toEqual({
      ok: false,
    });
  });

  it("markNotificationReadAction marks read and revalidates", async () => {
    const result = await markNotificationReadAction("n1");
    expect(result).toEqual({ ok: true });
    expect(notificationsMock.markRead).toHaveBeenCalledWith({
      id: "n1",
      userId: USER_ID,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/company", "layout");
  });

  it("markAllNotificationsReadAction marks all read", async () => {
    const result = await markAllNotificationsReadAction();
    expect(result).toEqual({ ok: true });
    expect(notificationsMock.markAllRead).toHaveBeenCalledWith(USER_ID);
  });

  it("switchOrganizationAction validates organization id", async () => {
    await expect(switchOrganizationAction("")).resolves.toEqual({
      ok: false,
      error: "INVALID",
    });
  });

  it("switchOrganizationAction rejects unauthenticated users", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    await expect(switchOrganizationAction(ORG_ID)).resolves.toEqual({
      ok: false,
      error: "UNAUTHENTICATED",
    });
  });

  it("switchOrganizationAction forbids non-members", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({
      userId: USER_ID,
      memberships: [{ organizationId: "other-org", role: "MEMBER" }],
      systemRoles: [],
    });
    await expect(switchOrganizationAction(ORG_ID)).resolves.toEqual({
      ok: false,
      error: "FORBIDDEN",
    });
  });

  it("switchOrganizationAction returns NOT_FOUND for unknown org (super admin)", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({
      userId: USER_ID,
      memberships: [],
      systemRoles: ["SUPER_ADMIN"],
    });
    orgDirectoryMock.getOrganizationById.mockResolvedValue(null);
    await expect(switchOrganizationAction(ORG_ID)).resolves.toEqual({
      ok: false,
      error: "NOT_FOUND",
    });
  });

  it("switchOrganizationAction switches active org for members", async () => {
    const result = await switchOrganizationAction(ORG_ID);
    expect(result).toEqual({ ok: true });
    expect(setActiveOrganizationCookieMock).toHaveBeenCalledWith(ORG_ID);
  });

  it("switchOrganizationAction allows super admin on existing org", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue({
      userId: USER_ID,
      memberships: [],
      systemRoles: ["SUPER_ADMIN"],
    });
    orgDirectoryMock.getOrganizationById.mockResolvedValue({ id: ORG_ID });
    const result = await switchOrganizationAction(ORG_ID);
    expect(result).toEqual({ ok: true });
  });

  it("exampleOrgAdminOnlyAction forbids guests", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    getCurrentActorContextMock.mockResolvedValue({ kind: "guest" });
    await expect(exampleOrgAdminOnlyAction()).resolves.toEqual({
      ok: false,
      error: "FORBIDDEN",
    });
  });

  it("exampleOrgAdminOnlyAction allows org admins", async () => {
    await expect(exampleOrgAdminOnlyAction()).resolves.toEqual({ ok: true });
  });

  it("submitPlanRequestAction rejects invalid payload", async () => {
    const result = await submitPlanRequestAction({
      desiredPlan: "x".repeat(100),
    });
    expect(result).toEqual({ ok: false });
  });

  it("submitPlanRequestAction rejects missing org context", async () => {
    getCurrentActorContextMock.mockResolvedValue({ kind: "guest" });
    const result = await submitPlanRequestAction({ message: "Need plan" });
    expect(result).toEqual({ ok: false });
  });

  it("submitPlanRequestAction requires authentication", async () => {
    getAuthenticatedPrincipalMock.mockResolvedValue(null);
    await expect(submitPlanRequestAction({})).resolves.toEqual({ ok: false });
  });

  it("submitPlanRequestAction creates plan request for org member", async () => {
    const result = await submitPlanRequestAction({
      desiredPlan: "PRO",
      message: "Need more seats",
    });
    expect(result).toEqual({ ok: true });
    expect(createPlanRequestMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        organizationId: ORG_ID,
        requestedById: USER_ID,
        desiredPlan: "PRO",
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/company/plan");
  });

  it("updatePlanRequestStatusAction requires super admin", async () => {
    findByIdMock.mockResolvedValue({
      id: USER_ID,
      systemRoles: [],
    });
    await expect(
      updatePlanRequestStatusAction({ id: "pr1", status: "NEW" }),
    ).resolves.toEqual({ ok: false });
  });

  it("updatePlanRequestStatusAction updates status for super admin", async () => {
    findByIdMock.mockResolvedValue({
      id: USER_ID,
      systemRoles: ["SUPER_ADMIN"],
    });
    const result = await updatePlanRequestStatusAction({
      id: "pr1",
      status: "CONTACTED",
    });
    expect(result).toEqual({ ok: true });
    expect(planRequestsMock.updateStatus).toHaveBeenCalledWith({
      id: "pr1",
      status: "CONTACTED",
    });
  });
});
