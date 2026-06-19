import type { FeedbackStatus } from "@/src/core/ports/feedback-repository-port";

export type FeedbackStatusFilter = FeedbackStatus | "ALL";

export const FEEDBACK_STATUS_TABS: {
  value: FeedbackStatusFilter;
  label: string;
}[] = [
  { value: "ALL", label: "Tous" },
  { value: "NEW", label: "Nouveau" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "RESOLVED", label: "Résolu" },
  { value: "WONT_FIX", label: "Won't fix" },
];

const FEEDBACK_STATUSES = new Set<FeedbackStatus>([
  "NEW",
  "IN_PROGRESS",
  "RESOLVED",
  "WONT_FIX",
]);

export function parseFeedbackStatusFilter(
  raw: string | undefined,
): FeedbackStatusFilter {
  if (!raw || raw === "ALL") return "ALL";
  if (FEEDBACK_STATUSES.has(raw as FeedbackStatus)) {
    return raw as FeedbackStatus;
  }
  return "ALL";
}

export function feedbackStatusForQuery(
  filter: FeedbackStatusFilter,
): FeedbackStatus | undefined {
  return filter === "ALL" ? undefined : filter;
}
