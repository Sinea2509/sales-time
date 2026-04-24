import { afterEach, describe, expect, it, vi } from "vitest";
import {
  signSuperAdminOrgCookieValue,
  verifySuperAdminOrgCookieValue,
} from "./super-admin-org-cookie-crypto";

describe("super-admin-org-cookie-crypto", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("verify returns null in production when secret is missing (no throw)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SUPER_ADMIN_ORG_COOKIE_SECRET", "");
    const raw =
      "eyJ2IjoxLCJ1aWQiOiJ1MSIsIm9yZyI6Im9yZzEiLCJleHAiOjk5OTk5OTk5OTl9.aaaa";
    expect(verifySuperAdminOrgCookieValue(raw, "u1")).toBeNull();
  });

  it("sign throws in production when secret is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SUPER_ADMIN_ORG_COOKIE_SECRET", "");
    expect(() =>
      signSuperAdminOrgCookieValue({
        actorUserId: "u1",
        targetOrganizationId: "org1",
        maxAgeSec: 60,
      }),
    ).toThrow(/SUPER_ADMIN_ORG_COOKIE_SECRET/);
  });

  it("round-trip verify when secret is set", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SUPER_ADMIN_ORG_COOKIE_SECRET", "test-secret-key");
    const raw = signSuperAdminOrgCookieValue({
      actorUserId: "user-a",
      targetOrganizationId: "org-z",
      maxAgeSec: 3600,
    });
    expect(verifySuperAdminOrgCookieValue(raw, "user-a")).toBe("org-z");
    expect(verifySuperAdminOrgCookieValue(raw, "other-user")).toBeNull();
  });
});
