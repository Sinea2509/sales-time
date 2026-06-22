import { describe, expect, it } from "@jest/globals";
import {
  buildElementXPath,
  defaultFeedbackPriorityForType,
  feedbackRowHasTargetElement,
  parseFeedbackExtra,
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

  it("parses feedback extra payloads", () => {
    expect(parseFeedbackExtra(null)).toEqual({});
    expect(parseFeedbackExtra({ targetElement: { cssSelector: "a" } })).toEqual({
      targetElement: { cssSelector: "a" },
    });
  });

  it("builds xpath for nested elements", () => {
    Object.defineProperty(global, "Node", {
      value: { ELEMENT_NODE: 1 },
      configurable: true,
    });
    const firstButton = {
      nodeType: 1,
      tagName: "BUTTON",
      parentElement: {
        nodeType: 1,
        tagName: "DIV",
        parentElement: null,
        previousElementSibling: null,
      },
      previousElementSibling: null,
    } as unknown as Element;
    const secondButton = {
      nodeType: 1,
      tagName: "BUTTON",
      parentElement: firstButton.parentElement,
      previousElementSibling: firstButton,
    } as unknown as Element;
    expect(buildElementXPath(firstButton)).toBe("/div[1]/button[1]");
    expect(buildElementXPath(secondButton)).toBe("/div[1]/button[2]");
  });

  it("suggests route-based source files", () => {
    expect(
      suggestFeedbackSourceFiles(null, "/company/analyse"),
    ).toContain("components/organisms/analyse-recommandations-section.tsx");
    expect(
      suggestFeedbackSourceFiles(null, "/company/contacts"),
    ).toContain("components/organisms/contacts-list-table.tsx");
    expect(
      suggestFeedbackSourceFiles(null, "/company/preparer"),
    ).toContain("app/[locale]/company/preparer/");
    expect(
      suggestFeedbackSourceFiles(null, "/admin/feedbacks"),
    ).toContain("components/organisms/admin-feedbacks-inbox.tsx");
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
