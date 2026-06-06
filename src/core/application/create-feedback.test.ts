import { describe, expect, it } from "@jest/globals";
import { createFeedback } from "./create-feedback";

describe("createFeedback", () => {
  it("delegates to feedback repository create", async () => {
    const row = { id: "fb_1", message: "test" };
    const feedbacks = {
      create: jest.fn().mockResolvedValue(row),
    };

    const input = {
      organizationId: "org_1",
      userId: "user_1",
      userEmail: "a@b.co",
      companyName: "Acme",
      type: "BUG" as const,
      message: "Something broke",
      screenshotUrl: null,
      pageUrl: "/company",
      userAgent: null,
      browser: null,
      os: null,
      deviceType: null,
      viewport: null,
      screenSize: null,
      locale: "fr",
      appVersion: null,
      consoleErrors: [],
      extra: {},
    };

    const result = await createFeedback({ feedbacks } as never, input);

    expect(feedbacks.create).toHaveBeenCalledWith(input);
    expect(result).toBe(row);
  });
});
