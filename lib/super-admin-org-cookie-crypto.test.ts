import { createHmac } from "node:crypto";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "@jest/globals";
import {
  signSuperAdminOrgCookieValue,
  verifySuperAdminOrgCookieValue,
} from "./super-admin-org-cookie-crypto";

describe("super-admin-org-cookie-crypto", () => {
  let prevNodeEnv: string | undefined;
  let prevCookieSecret: string | undefined;

  beforeEach(() => {
    prevNodeEnv = process.env.NODE_ENV;
    prevCookieSecret = process.env.SUPER_ADMIN_ORG_COOKIE_SECRET;
  });

  afterEach(() => {
    if (prevNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevNodeEnv;
    if (prevCookieSecret === undefined)
      delete process.env.SUPER_ADMIN_ORG_COOKIE_SECRET;
    else process.env.SUPER_ADMIN_ORG_COOKIE_SECRET = prevCookieSecret;
  });

  it("verify returns null in production when secret is missing (no throw)", () => {
    process.env.NODE_ENV = "production";
    process.env.SUPER_ADMIN_ORG_COOKIE_SECRET = "";
    const raw =
      "eyJ2IjoxLCJ1aWQiOiJ1MSIsIm9yZyI6Im9yZzEiLCJleHAiOjk5OTk5OTk5OTl9.aaaa";
    expect(verifySuperAdminOrgCookieValue(raw, "u1")).toBeNull();
  });

  it("sign throws in production when secret is missing", () => {
    process.env.NODE_ENV = "production";
    process.env.SUPER_ADMIN_ORG_COOKIE_SECRET = "";
    expect(() =>
      signSuperAdminOrgCookieValue({
        actorUserId: "u1",
        targetOrganizationId: "org1",
        maxAgeSec: 60,
      }),
    ).toThrow(/SUPER_ADMIN_ORG_COOKIE_SECRET/);
  });

  it("round-trip verify when secret is set", () => {
    process.env.NODE_ENV = "production";
    process.env.SUPER_ADMIN_ORG_COOKIE_SECRET = "test-secret-key";
    const raw = signSuperAdminOrgCookieValue({
      actorUserId: "user-a",
      targetOrganizationId: "org-z",
      maxAgeSec: 3600,
    });
    expect(verifySuperAdminOrgCookieValue(raw, "user-a")).toBe("org-z");
    expect(verifySuperAdminOrgCookieValue(raw, "other-user")).toBeNull();
  });

  it("uses dev secret in non-production when env secret unset", () => {
    process.env.NODE_ENV = "test";
    delete process.env.SUPER_ADMIN_ORG_COOKIE_SECRET;
    const raw = signSuperAdminOrgCookieValue({
      actorUserId: "u1",
      targetOrganizationId: "org-dev",
      maxAgeSec: 120,
    });
    expect(verifySuperAdminOrgCookieValue(raw, "u1")).toBe("org-dev");
  });

  it("verify rejects single-segment cookie", () => {
    process.env.NODE_ENV = "production";
    process.env.SUPER_ADMIN_ORG_COOKIE_SECRET = "k";
    expect(verifySuperAdminOrgCookieValue("only-one-part", "u1")).toBeNull();
    expect(verifySuperAdminOrgCookieValue("payloadB64only.", "u1")).toBeNull();
  });

  it("verify rejects malformed payload JSON", () => {
    process.env.NODE_ENV = "production";
    process.env.SUPER_ADMIN_ORG_COOKIE_SECRET = "k";
    const badPayload = Buffer.from("{not json", "utf8").toString("base64url");
    const sig = createHmac("sha256", "k")
      .update(badPayload)
      .digest("base64url");
    expect(verifySuperAdminOrgCookieValue(`${badPayload}.${sig}`, "u1")).toBeNull();
  });

  it("verify rejects wrong payload version or org type", () => {
    process.env.NODE_ENV = "production";
    process.env.SUPER_ADMIN_ORG_COOKIE_SECRET = "k";
    const p1 = Buffer.from(
      JSON.stringify({
        v: 2,
        uid: "u1",
        org: "o1",
        exp: 9_999_999_999,
      }),
      "utf8",
    ).toString("base64url");
    const sig1 = createHmac("sha256", "k").update(p1).digest("base64url");
    expect(verifySuperAdminOrgCookieValue(`${p1}.${sig1}`, "u1")).toBeNull();

    const p2 = Buffer.from(
      JSON.stringify({
        v: 1,
        uid: "u1",
        org: 99,
        exp: 9_999_999_999,
      }),
      "utf8",
    ).toString("base64url");
    const sig2 = createHmac("sha256", "k").update(p2).digest("base64url");
    expect(verifySuperAdminOrgCookieValue(`${p2}.${sig2}`, "u1")).toBeNull();
  });

  it("verify rejects expired cookie and bad signature length", () => {
    process.env.NODE_ENV = "production";
    process.env.SUPER_ADMIN_ORG_COOKIE_SECRET = "k";
    const past = Math.floor(Date.now() / 1000) - 10;
    const payload = Buffer.from(
      JSON.stringify({ v: 1, uid: "u1", org: "o1", exp: past }),
      "utf8",
    ).toString("base64url");
    const sig = createHmac("sha256", "k").update(payload).digest("base64url");
    expect(verifySuperAdminOrgCookieValue(`${payload}.${sig}`, "u1")).toBeNull();

    expect(verifySuperAdminOrgCookieValue(`${payload}.short`, "u1")).toBeNull();
  });
});
