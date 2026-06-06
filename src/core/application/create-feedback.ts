import type { FeedbackRepositoryPort } from "@/src/core/ports/feedback-repository-port";
import type { FeedbackType } from "@/src/core/ports/feedback-repository-port";

export async function createFeedback(
  deps: { feedbacks: FeedbackRepositoryPort },
  input: {
    organizationId: string | null;
    userId: string | null;
    userEmail: string | null;
    companyName: string | null;
    type: FeedbackType;
    message: string;
    screenshotUrl: string | null;
    pageUrl: string | null;
    userAgent: string | null;
    browser: string | null;
    os: string | null;
    deviceType: string | null;
    viewport: string | null;
    screenSize: string | null;
    locale: string | null;
    appVersion: string | null;
    consoleErrors: unknown;
    extra: unknown;
  },
) {
  return deps.feedbacks.create(input);
}
