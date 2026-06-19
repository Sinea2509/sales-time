import { describe, expect, it } from "@jest/globals";
import {
  formatNetworkErrorEntry,
  parseFeedbackUserAgent,
  resolveFeedbackPriority,
  sanitizeNetworkErrorUrl,
} from "./feedback-technical-context";

describe("feedback-technical-context", () => {
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
  });
});
