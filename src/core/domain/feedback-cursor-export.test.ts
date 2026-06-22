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
    priority: "HIGH",
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
          targetElement: {
            cssSelector: '[data-feedback-id="meeting-create-submit"]',
            xpath: "/html/body/button[1]",
            tagName: "button",
            textSnippet: "Enregistrer",
            ariaLabel: null,
            boundingRect: { x: 10, y: 20, width: 100, height: 40 },
            scroll: { x: 0, y: 120 },
            dataFeedbackId: "meeting-create-submit",
          },
          networkErrors: ["POST /api/meetings → 500"],
          consoleWarnings: ["deprecated API"],
          technicalContext: { routePath: "/company/rendez-vous", scrollPosition: "0,120" },
        },
      }),
    );

    expect(md).toContain("# 🐛 BUG report — SalesTime (#fb_abcde");
    expect(md).toContain("**Priority:** high");
    expect(md).toContain("user@example.com (org: Acme) (rôle: Manager)");
    expect(md).toContain("Le bouton ne répond pas sur mobile");
    expect(md).toContain("- TypeError: x is null");
    expect(md).toContain("https://blob.example/shot.png");
    expect(md).toContain('data-feedback-id="meeting-create-submit"');
    expect(md).toContain("POST /api/meetings → 500");
    expect(md).toContain("deprecated API");
    expect(md).toContain("components/organisms/meeting-create-form.tsx");
  });

  it("shows placeholder when no console errors", () => {
    const md = buildFeedbackCursorMarkdown(
      sampleFeedback({ consoleErrors: [], screenshotUrl: null }),
    );
    expect(md).toContain("- (aucune)");
    expect(md).toContain("(aucune)");
  });

  it("includes aria-label, crop url and submit context when present", () => {
    const md = buildFeedbackCursorMarkdown(
      sampleFeedback({
        extra: {
          targetElement: {
            cssSelector: "button",
            xpath: "/button[1]",
            tagName: "button",
            textSnippet: "",
            ariaLabel: "Save",
            boundingRect: { x: 0, y: 0, width: 10, height: 10 },
            scroll: { x: 0, y: 0 },
            dataFeedbackId: null,
          },
          elementCropUrl: "https://blob.example/crop.png",
          submitContext: { step: 2 },
        },
      }),
    );
    expect(md).toContain('Aria-label: "Save"');
    expect(md).toContain("https://blob.example/crop.png");
    expect(md).toContain('"step": 2');
    expect(md).toContain("- Texte: (vide)");
  });
});
