import { afterEach, describe, expect, it } from "@jest/globals";
import {
  buildClientTechnicalContextSnapshot,
  formatNetworkErrorEntry,
  parseFeedbackUserAgent,
  resolveFeedbackPriority,
  sanitizeNetworkErrorUrl,
} from "./feedback-technical-context";

describe("feedback-technical-context", () => {
  afterEach(() => {
    // @ts-expect-error test cleanup
    delete global.window;
  });

  it("returns nulls for empty user agent", () => {
    expect(parseFeedbackUserAgent(null)).toEqual({
      browser: null,
      os: null,
      deviceType: null,
    });
    expect(parseFeedbackUserAgent("   ")).toEqual({
      browser: null,
      os: null,
      deviceType: null,
    });
  });

  it("parses user agent into browser, os and device", () => {
    const parsed = parseFeedbackUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    expect(parsed.browser).toContain("Chrome");
    expect(parsed.os).toContain("macOS");
    expect(parsed.deviceType).toBe("desktop");
  });

  it("resolves priority from input or type default", () => {
    expect(resolveFeedbackPriority({ type: "BUG" })).toBe("HIGH");
    expect(resolveFeedbackPriority({ type: "IDEA", priority: "CRITICAL" })).toBe(
      "CRITICAL",
    );
  });

  it("sanitizes network urls to pathname only", () => {
    expect(
      sanitizeNetworkErrorUrl("https://app.example/api/meetings?secret=1"),
    ).toBe("/api/meetings");
  });

  it("formats network error entries", () => {
    expect(
      formatNetworkErrorEntry({
        method: "post",
        url: "/api/meetings",
        status: 500,
      }),
    ).toBe("POST /api/meetings → 500");
    expect(
      formatNetworkErrorEntry({
        method: "get",
        url: "/api/meetings",
      }),
    ).toBe("GET /api/meetings → network error");
  });

  it("falls back when URL parsing fails", () => {
    expect(sanitizeNetworkErrorUrl("http://[")).toBe("http://[");
  });

  it("returns null snapshot on server", () => {
    expect(buildClientTechnicalContextSnapshot()).toEqual({
      routePath: null,
      referrer: null,
      timezone: null,
      scrollPosition: null,
    });
  });

  it("captures browser context when window is defined", () => {
    const location = {
      pathname: "/company",
      search: "?tab=1",
    };
    global.window = {
      location,
      scrollX: 10,
      scrollY: 20,
    } as unknown as Window & typeof globalThis;
    global.document = { referrer: "https://example.com" } as Document;
    expect(buildClientTechnicalContextSnapshot()).toEqual({
      routePath: "/company?tab=1",
      referrer: "https://example.com",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      scrollPosition: "10,20",
    });
  });
});
