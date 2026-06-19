import { describe, expect, it } from "@jest/globals";
import {
  defaultFeedbackPriorityForType,
  feedbackRowHasTargetElement,
  suggestFeedbackSourceFiles,
  truncateFeedbackText,
} from "./feedback-target-element";

describe("feedback-target-element", () => {
  it("truncates long text snippets", () => {
    expect(truncateFeedbackText("a".repeat(250), 200)).toHaveLength(200);
    expect(truncateFeedbackText("a".repeat(250), 200).endsWith("…")).toBe(true);
  });

  it("defaults bug priority to HIGH", () => {
    expect(defaultFeedbackPriorityForType("BUG")).toBe("HIGH");
    expect(defaultFeedbackPriorityForType("IDEA")).toBe("MEDIUM");
  });

  it("detects target element in extra payload", () => {
    expect(
      feedbackRowHasTargetElement({
        targetElement: { cssSelector: "button" },
      }),
    ).toBe(true);
    expect(feedbackRowHasTargetElement({})).toBe(false);
  });

  it("suggests source files from data-feedback-id and route", () => {
    const files = suggestFeedbackSourceFiles(
      {
        cssSelector: '[data-feedback-id="meeting-create-submit"]',
        xpath: "/button[1]",
        tagName: "button",
        textSnippet: "Save",
        ariaLabel: null,
        boundingRect: { x: 0, y: 0, width: 1, height: 1 },
        scroll: { x: 0, y: 0 },
        dataFeedbackId: "meeting-create-submit",
      },
      "/company/rendez-vous",
    );
    expect(files).toContain("components/organisms/meeting-create-form.tsx");
    expect(files).toContain("components/organisms/rendez-vous-meetings-shell.tsx");
  });
});
