import { describe, expect, it } from "@jest/globals";
import {
  buildFeedbackListFilters,
  parseFeedbackBooleanFilter,
  parseFeedbackPriorityFilter,
  parseFeedbackTypeFilter,
} from "@/lib/feedback-list-filters";

describe("feedback-list-filters", () => {
  it("parses list query params", () => {
    expect(parseFeedbackTypeFilter("BUG")).toBe("BUG");
    expect(parseFeedbackTypeFilter("invalid")).toBeNull();
    expect(parseFeedbackPriorityFilter("CRITICAL")).toBe("CRITICAL");
    expect(parseFeedbackBooleanFilter("true")).toBe(true);
  });

  it("builds repository filters from search params", () => {
    expect(
      buildFeedbackListFilters({
        type: "BUG",
        priority: "HIGH",
        hasScreenshot: "true",
        hasTargetElement: "false",
      }),
    ).toEqual({
      type: "BUG",
      priority: "HIGH",
      hasScreenshot: true,
      hasTargetElement: false,
    });
  });
});
