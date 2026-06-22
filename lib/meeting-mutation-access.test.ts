import { describe, expect, it, jest } from "@jest/globals";
import { assertCanMutateMeetingForOrg } from "./meeting-mutation-access";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- jest mock
type JestFn = jest.Mock<any>;

describe("assertCanMutateMeetingForOrg", () => {
  const meeting = {
    id: "m1",
    sellerUserId: "seller_1",
    organizationId: "org_1",
  };

  it("returns NOT_FOUND when meeting is outside org scope", async () => {
    const findMeetingByIdForOrg = jest.fn() as JestFn;
    findMeetingByIdForOrg.mockResolvedValue(null);
    const meetings = { findMeetingByIdForOrg };

    const result = await assertCanMutateMeetingForOrg(meetings as never, {
      organizationId: "org_1",
      meetingId: "m1",
      actorUserId: "seller_1",
      canManageOrganization: false,
    });

    expect(result).toEqual({ ok: false, error: "NOT_FOUND" });
    expect(meetings.findMeetingByIdForOrg).toHaveBeenCalledWith({
      id: "m1",
      organizationId: "org_1",
    });
  });

  it("returns FORBIDDEN when seller is not owner and not manager", async () => {
    const findMeetingByIdForOrg = jest.fn() as JestFn;
    findMeetingByIdForOrg.mockResolvedValue(meeting);
    const meetings = { findMeetingByIdForOrg };

    const result = await assertCanMutateMeetingForOrg(meetings as never, {
      organizationId: "org_1",
      meetingId: "m1",
      actorUserId: "other_user",
      canManageOrganization: false,
    });

    expect(result).toEqual({ ok: false, error: "FORBIDDEN" });
  });

  it("allows org managers to mutate any meeting", async () => {
    const findMeetingByIdForOrg = jest.fn() as JestFn;
    findMeetingByIdForOrg.mockResolvedValue(meeting);
    const meetings = { findMeetingByIdForOrg };

    const result = await assertCanMutateMeetingForOrg(meetings as never, {
      organizationId: "org_1",
      meetingId: "m1",
      actorUserId: "manager_1",
      canManageOrganization: true,
    });

    expect(result.ok).toBe(true);
  });
});
