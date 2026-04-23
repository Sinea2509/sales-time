import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  signSuperAdminOrgCookieValue,
  verifySuperAdminOrgCookieValue,
} from "./super-admin-org-cookie-crypto";

describe("super-admin-org-cookie-crypto", () => {
  const prevSecret = process.env.SUPER_ADMIN_ORG_COOKIE_SECRET;

  beforeEach(() => {
    process.env.SUPER_ADMIN_ORG_COOKIE_SECRET = "test-secret-for-hmac-only";
  });

  afterEach(() => {
    if (prevSecret === undefined) {
      delete process.env.SUPER_ADMIN_ORG_COOKIE_SECRET;
    } else {
      process.env.SUPER_ADMIN_ORG_COOKIE_SECRET = prevSecret;
    }
  });

  it("round-trips org for the same actor user", () => {
    const raw = signSuperAdminOrgCookieValue({
      actorUserId: "user_abc",
      targetOrganizationId: "org_xyz",
      maxAgeSec: 3600,
    });
    expect(verifySuperAdminOrgCookieValue(raw, "user_abc")).toBe("org_xyz");
  });

  it("rejects when actor user does not match", () => {
    const raw = signSuperAdminOrgCookieValue({
      actorUserId: "user_abc",
      targetOrganizationId: "org_xyz",
      maxAgeSec: 3600,
    });
    expect(verifySuperAdminOrgCookieValue(raw, "user_other")).toBeNull();
  });

  it("rejects legacy unsigned cookie values", () => {
    expect(verifySuperAdminOrgCookieValue("org_plaintext", "user_abc")).toBeNull();
  });

  it("rejects tampered signature", () => {
    const raw = signSuperAdminOrgCookieValue({
      actorUserId: "user_abc",
      targetOrganizationId: "org_xyz",
      maxAgeSec: 3600,
    });
    const tampered = `${raw.slice(0, -4)}xxxx`;
    expect(verifySuperAdminOrgCookieValue(tampered, "user_abc")).toBeNull();
  });
});
