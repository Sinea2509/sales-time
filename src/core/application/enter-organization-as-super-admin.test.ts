import { describe, expect, it, vi } from "vitest";
import { enterOrganizationAsSuperAdmin } from "./enter-organization-as-super-admin";

describe("enterOrganizationAsSuperAdmin", () => {
  it("returns NOT_SUPER_ADMIN when user lacks system role", async () => {
    const auth = { getClerkUserId: vi.fn().mockResolvedValue("user_1") };
    const users = {
      findByClerkUserId: vi.fn().mockResolvedValue({
        id: "int_1",
        clerkUserId: "user_1",
        systemRoles: [] as const,
      }),
    };
    const audit = { logSuperAdminAction: vi.fn().mockResolvedValue(undefined) };

    const result = await enterOrganizationAsSuperAdmin(
      { auth, users, audit },
      { targetClerkOrgId: "org_1" },
    );

    expect(result).toEqual({ ok: false, error: "NOT_SUPER_ADMIN" });
    expect(audit.logSuperAdminAction).not.toHaveBeenCalled();
  });

  it("writes audit log when super admin enters org", async () => {
    const auth = { getClerkUserId: vi.fn().mockResolvedValue("user_1") };
    const users = {
      findByClerkUserId: vi.fn().mockResolvedValue({
        id: "int_1",
        clerkUserId: "user_1",
        systemRoles: ["SUPER_ADMIN"] as const,
      }),
    };
    const audit = { logSuperAdminAction: vi.fn().mockResolvedValue(undefined) };

    const result = await enterOrganizationAsSuperAdmin(
      { auth, users, audit },
      { targetClerkOrgId: "org_2", reason: "INC-42" },
    );

    expect(result).toEqual({ ok: true });
    expect(audit.logSuperAdminAction).toHaveBeenCalledWith({
      actorInternalUserId: "int_1",
      clerkOrgId: "org_2",
      action: "ENTER_ORG",
      reason: "INC-42",
    });
  });
});
