/**
 * Stable element targeting for in-app feedback.
 *
 * Convention: add `data-feedback-id="{feature}-{action}"` on interactive UI
 * (e.g. `meeting-create-submit`, `contacts-row-menu`) so picker + exports resolve
 * reliably without brittle CSS selectors.
 */
import { z } from "zod";

export const feedbackBoundingRectSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const feedbackScrollSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const feedbackTargetElementSchema = z.object({
  cssSelector: z.string().max(500),
  xpath: z.string().max(1000),
  tagName: z.string().max(64),
  textSnippet: z.string().max(200),
  ariaLabel: z.string().max(200).nullable(),
  boundingRect: feedbackBoundingRectSchema,
  scroll: feedbackScrollSchema,
  dataFeedbackId: z.string().max(128).nullable(),
});

export type FeedbackTargetElement = z.infer<typeof feedbackTargetElementSchema>;

export type FeedbackTechnicalContextSnapshot = {
  routePath: string | null;
  referrer: string | null;
  timezone: string | null;
  scrollPosition: string | null;
};

export type FeedbackExtraPayload = {
  targetElement?: FeedbackTargetElement | null;
  elementCropUrl?: string | null;
  technicalContext?: FeedbackTechnicalContextSnapshot | null;
  networkErrors?: string[];
  consoleWarnings?: string[];
  submitContext?: unknown;
};

const FEEDBACK_ID_SOURCE_MAP: Record<string, string[]> = {
  meeting: [
    "components/organisms/meeting-create-form.tsx",
    "components/organisms/rendez-vous-meetings-shell.tsx",
  ],
  contacts: ["components/organisms/contacts-list-table.tsx"],
  analyse: ["components/organisms/analyse-recommandations-section.tsx"],
  dashboard: [
    "components/organisms/dashboard-kpi-cards.tsx",
    "components/organisms/dashboard-home-shell.tsx",
  ],
  onboarding: ["components/organisms/onboarding-wizard.tsx"],
  plan: ["components/organisms/plan-upgrade-request-form.tsx"],
  preparer: ["app/[locale]/company/preparer/"],
  rendez: ["components/organisms/rendez-vous-meetings-shell.tsx"],
};

export function truncateFeedbackText(value: string, max = 200): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function buildElementXPath(element: Element): string {
  const segments: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1;
    let sibling = current.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === current.tagName) index += 1;
      sibling = sibling.previousElementSibling;
    }
    segments.unshift(`${current.tagName.toLowerCase()}[${index}]`);
    current = current.parentElement;
  }

  return `/${segments.join("/")}`;
}

export function parseFeedbackExtra(value: unknown): FeedbackExtraPayload {
  if (value == null || typeof value !== "object") return {};
  return value as FeedbackExtraPayload;
}

export function feedbackRowHasTargetElement(extra: unknown): boolean {
  const parsed = parseFeedbackExtra(extra);
  return parsed.targetElement != null;
}

export function suggestFeedbackSourceFiles(
  target: FeedbackTargetElement | null | undefined,
  routePath: string | null,
): string[] {
  const suggestions = new Set<string>();

  if (target?.dataFeedbackId) {
    const prefix = target.dataFeedbackId.split("-")[0] ?? "";
    for (const [key, paths] of Object.entries(FEEDBACK_ID_SOURCE_MAP)) {
      if (target.dataFeedbackId.startsWith(`${key}-`) || prefix === key) {
        for (const path of paths) suggestions.add(path);
      }
    }
  }

  if (routePath) {
    if (routePath.includes("/rendez-vous")) {
      suggestions.add("components/organisms/rendez-vous-meetings-shell.tsx");
    }
    if (routePath.includes("/analyse")) {
      suggestions.add("components/organisms/analyse-recommandations-section.tsx");
    }
    if (routePath.includes("/contacts")) {
      suggestions.add("components/organisms/contacts-list-table.tsx");
    }
    if (routePath.includes("/preparer")) {
      suggestions.add("app/[locale]/company/preparer/");
    }
    if (routePath.includes("/admin/feedbacks")) {
      suggestions.add("components/organisms/admin-feedbacks-inbox.tsx");
    }
  }

  return [...suggestions];
}

export function defaultFeedbackPriorityForType(
  type: "BUG" | "IDEA" | "QUESTION" | "OTHER",
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (type === "BUG") return "HIGH";
  return "MEDIUM";
}
