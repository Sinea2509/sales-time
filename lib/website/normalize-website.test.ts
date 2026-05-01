import { describe, expect, it } from "@jest/globals";
import { tryNormalizeWebsiteForOrgKey } from "./normalize-website";

describe("tryNormalizeWebsiteForOrgKey", () => {
  it("strips protocol, path, and www", () => {
    expect(
      tryNormalizeWebsiteForOrgKey("HTTPS://WWW.Example.com/foo?q=1"),
    ).toEqual({ ok: true, value: "example.com" });
  });

  it("adds https when missing", () => {
    expect(tryNormalizeWebsiteForOrgKey("acme.io")).toEqual({
      ok: true,
      value: "acme.io",
    });
  });

  it("lowercases host", () => {
    expect(tryNormalizeWebsiteForOrgKey("https://Sub.DOMAIN.org")).toEqual({
      ok: true,
      value: "sub.domain.org",
    });
  });

  it("rejects empty", () => {
    expect(tryNormalizeWebsiteForOrgKey("  ")).toEqual({
      ok: false,
      error: "EMPTY",
    });
  });

  it("rejects invalid", () => {
    expect(tryNormalizeWebsiteForOrgKey("not a url")).toEqual({
      ok: false,
      error: "INVALID",
    });
  });

  it("rejects data URLs (invalid for org key)", () => {
    expect(tryNormalizeWebsiteForOrgKey("data:text/plain,hi")).toEqual({
      ok: false,
      error: "INVALID",
    });
  });

  it("rejects empty hostname", () => {
    expect(tryNormalizeWebsiteForOrgKey("https://")).toEqual({
      ok: false,
      error: "INVALID",
    });
  });

  it("rejects host that is only www.", () => {
    expect(tryNormalizeWebsiteForOrgKey("https://www.")).toEqual({
      ok: false,
      error: "INVALID",
    });
  });
});
