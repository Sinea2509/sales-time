import type {
  FeedbackPriority,
  FeedbackType,
} from "@/src/core/ports/feedback-repository-port";

export type FeedbackListQuery = {
  status?: string;
  type?: string;
  priority?: string;
  hasScreenshot?: string;
  hasTargetElement?: string;
};

export function parseFeedbackTypeFilter(raw: string | undefined): FeedbackType | null {
  if (raw === "BUG" || raw === "IDEA" || raw === "QUESTION" || raw === "OTHER") {
    return raw;
  }
  return null;
}

export function parseFeedbackPriorityFilter(
  raw: string | undefined,
): FeedbackPriority | null {
  if (raw === "LOW" || raw === "MEDIUM" || raw === "HIGH" || raw === "CRITICAL") {
    return raw;
  }
  return null;
}

export function parseFeedbackBooleanFilter(raw: string | undefined): boolean | null {
  if (raw === "true") return true;
  if (raw === "false") return false;
  return null;
}

export function buildFeedbackListFilters(searchParams: FeedbackListQuery) {
  return {
    type: parseFeedbackTypeFilter(searchParams.type),
    priority: parseFeedbackPriorityFilter(searchParams.priority),
    hasScreenshot: parseFeedbackBooleanFilter(searchParams.hasScreenshot),
    hasTargetElement: parseFeedbackBooleanFilter(searchParams.hasTargetElement),
  };
}

export const FEEDBACK_PRIORITY_LABELS: Record<FeedbackPriority, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL: "Critique",
};

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  BUG: "Bug",
  IDEA: "Idée",
  QUESTION: "Question",
  OTHER: "Autre",
};
