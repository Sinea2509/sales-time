import { finder } from "@medv/finder";
import {
  buildElementXPath,
  truncateFeedbackText,
  type FeedbackTargetElement,
} from "@/src/core/domain/feedback-target-element";

export function isFeedbackPickerExcludedElement(element: Element | null): boolean {
  if (!element) return true;
  if (element.closest("[data-feedback-overlay]")) return true;
  if (element.closest("[data-feedback-dialog]")) return true;
  const tag = element.tagName.toLowerCase();
  return tag === "html" || tag === "body";
}

export function resolveMeaningfulPickerTarget(element: Element | null): Element | null {
  let current = element;
  while (current && isFeedbackPickerExcludedElement(current)) {
    current = current.parentElement;
  }
  return current;
}

export function readDataFeedbackIdFromDom(element: Element): string | null {
  const withId = element.closest("[data-feedback-id]");
  if (!withId) return null;
  const id = withId.getAttribute("data-feedback-id");
  return id?.trim() ? id.trim() : null;
}

export function captureTargetElementFromDom(element: Element): FeedbackTargetElement {
  const rect = element.getBoundingClientRect();
  const dataFeedbackId = readDataFeedbackIdFromDom(element);
  const ariaLabel = element.getAttribute("aria-label");

  let cssSelector = "";
  if (dataFeedbackId) {
    cssSelector = `[data-feedback-id="${dataFeedbackId}"]`;
  } else {
    try {
      cssSelector = finder(element);
    } catch {
      cssSelector = element.tagName.toLowerCase();
    }
  }

  return {
    cssSelector,
    xpath: buildElementXPath(element),
    tagName: element.tagName.toLowerCase(),
    textSnippet: truncateFeedbackText(element.textContent ?? ""),
    ariaLabel: ariaLabel?.trim() ? truncateFeedbackText(ariaLabel, 200) : null,
    boundingRect: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    },
    scroll: {
      x: window.scrollX,
      y: window.scrollY,
    },
    dataFeedbackId,
  };
}

// Re-export for convenience in client components
export { readDataFeedbackIdFromDom as readDataFeedbackId };
