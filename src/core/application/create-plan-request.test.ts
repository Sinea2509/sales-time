import { describe, expect, it, beforeEach } from "@jest/globals";

jest.mock("@/lib/email/mailer", () => ({
  sendTransactionalEmail: jest.fn().mockResolvedValue(undefined),
}));

import { sendTransactionalEmail } from "@/lib/email/mailer";
import { createPlanRequest } from "./create-plan-request";

const mockedEmail = sendTransactionalEmail as jest.MockedFunction<
  typeof sendTransactionalEmail
>;

describe("createPlanRequest", () => {
  beforeEach(() => {
    mockedEmail.mockClear();
    delete process.env.SUPERADMIN_EMAILS;
  });

  it("creates plan request and emails requester", async () => {
    const row = {
      id: "pr_1",
      organizationId: "org_1",
      organizationName: "Acme",
      requestedById: "user_1",
      requesterEmail: "user@example.com",
      desiredPlan: "Team",
      message: "Besoin vue manager",
      status: "NEW" as const,
      handledAt: null,
      createdAt: new Date(),
    };
    const planRequests = { create: jest.fn().mockResolvedValue(row) };

    const result = await createPlanRequest({ planRequests } as never, {
      organizationId: "org_1",
      requestedById: "user_1",
      desiredPlan: "Team",
      message: "Besoin vue manager",
      requesterEmail: "user@example.com",
    });

    expect(result).toBe(row);
    expect(mockedEmail).toHaveBeenCalledTimes(1);
    expect(mockedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "user@example.com" }),
    );
  });

  it("notifies super admin when SUPERADMIN_EMAILS is set", async () => {
    process.env.SUPERADMIN_EMAILS = "admin@example.com,other@example.com";
    const planRequests = {
      create: jest.fn().mockResolvedValue({
        id: "pr_2",
        organizationName: "Acme",
        desiredPlan: "Team",
        message: "Hello",
      }),
    };

    await createPlanRequest({ planRequests } as never, {
      organizationId: "org_1",
      requestedById: null,
      desiredPlan: "Team",
      message: "Hello",
      requesterEmail: "user@example.com",
    });

    expect(mockedEmail).toHaveBeenCalledTimes(2);
    expect(mockedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "admin@example.com" }),
    );
  });
});
