import { describe, expect, it } from "@jest/globals";
import { buildFeedbackCursorMarkdown } from "./feedback-cursor-export";
import type { FeedbackRow } from "@/src/core/ports/feedback-repository-port";

function sampleFeedback(over: Partial<FeedbackRow> = {}): FeedbackRow {
  return {
    id: "fb_abcdefghijklmnop",
    organizationId: "org_1",
    userId: "user_1",
    userEmail: "user@example.com",
    companyName: "Acme",
    type: "BUG",
    message: "Le bouton ne répond pas\nsur mobile",
    status: "NEW",
    screenshotUrl: "https://blob.example/shot.png",
    pageUrl: "https://app.example/company",
    userAgent: "Mozilla/5.0",
    browser: "Chrome",
    os: "Linux",
    deviceType: "desktop",
    viewport: "1280x800",
    screenSize: "1920x1080",
    locale: "fr-FR",
    appVersion: "abc123",
    consoleErrors: ["TypeError: x is null"],
    extra: { route: "/company" },
    adminNotes: null,
    handledAt: null,
    createdAt: new Date("2026-06-01T12:00:00.000Z"),
    ...over,
  };
}

describe("buildFeedbackCursorMarkdown", () => {
  it("formats feedback as markdown for Cursor export", () => {
    const md = buildFeedbackCursorMarkdown(
      sampleFeedback({
        extra: {
          organizationMembershipRole: "ADMIN",
          workspaceRoleMode: "admin",
          systemRoles: [],
          organizationId: "org_1",
        },
      }),
    );

    expect(md).toContain("# 🐛 BUG report — SalesTime (#fb_abcde");
    expect(md).toContain("user@example.com (org: Acme) (rôle: Manager)");
    expect(md).toContain("Le bouton ne répond pas sur mobile");
    expect(md).toContain("- TypeError: x is null");
    expect(md).toContain("https://blob.example/shot.png");
    expect(md).toContain('"organizationId": "org_1"');
  });

  it("shows placeholder when no console errors", () => {
    const md = buildFeedbackCursorMarkdown(
      sampleFeedback({ consoleErrors: [], screenshotUrl: null }),
    );
    expect(md).toContain("- (aucune)");
    expect(md).toContain("(aucune)");
  });
});
