import { describe, expect, it } from "@jest/globals";
import {
  feedbackStatusForQuery,
  parseFeedbackStatusFilter,
} from "./feedback-status-filter";

describe("parseFeedbackStatusFilter", () => {
  it("defaults to ALL for missing or invalid values", () => {
    expect(parseFeedbackStatusFilter(undefined)).toBe("ALL");
    expect(parseFeedbackStatusFilter("bogus")).toBe("ALL");
  });

  it("accepts valid status values", () => {
    expect(parseFeedbackStatusFilter("NEW")).toBe("NEW");
    expect(parseFeedbackStatusFilter("RESOLVED")).toBe("RESOLVED");
  });
});

describe("feedbackStatusForQuery", () => {
  it("maps ALL to undefined for repository queries", () => {
    expect(feedbackStatusForQuery("ALL")).toBeUndefined();
    expect(feedbackStatusForQuery("NEW")).toBe("NEW");
  });
});
