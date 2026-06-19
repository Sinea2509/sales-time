import { formatNetworkErrorEntry } from "@/src/core/domain/feedback-technical-context";

const MAX_ENTRIES = 20;

const networkErrors: string[] = [];
let initialized = false;
let originalFetch: typeof fetch | null = null;

function pushNetworkError(entry: string) {
  networkErrors.push(entry);
  if (networkErrors.length > MAX_ENTRIES) networkErrors.shift();
}

export function initFeedbackNetworkCapture(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const method = (init?.method ?? "GET").toUpperCase();
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    try {
      const response = await originalFetch!(input, init);
      if (!response.ok) {
        pushNetworkError(
          formatNetworkErrorEntry({
            method,
            url,
            status: response.status,
            origin: window.location.origin,
          }),
        );
      }
      return response;
    } catch (error) {
      pushNetworkError(
        formatNetworkErrorEntry({
          method,
          url,
          status: null,
          origin: window.location.origin,
        }),
      );
      throw error;
    }
  };
}

export function snapshotFeedbackNetworkErrors(): string[] {
  return [...networkErrors];
}

export function resetFeedbackNetworkCaptureForTests(): void {
  networkErrors.length = 0;
  if (originalFetch && typeof window !== "undefined") {
    window.fetch = originalFetch;
  }
  originalFetch = null;
  initialized = false;
}
