import { describe, expect, it } from "@jest/globals";
import { updateMeetingForOrg } from "./update-meeting-for-org";

const baseInput = {
  organizationId: "org_1",
  meetingId: "meet_1",
  prospectName: " Acme Corp ",
  meetingAt: new Date("2026-06-01T10:00:00.000Z"),
  durationMin: 30,
  meetingType: "Découverte",
  pipelineStage: "Qualifié",
  potentialAmount: 10_000,
  transcript: "  Bonjour, merci pour ce RDV.  ",
  notes: "  note  ",
  outcome: "FOLLOW_UP" as const,
};

function makeDeps(
  over: Partial<{
    existing: { id: string } | null | undefined;
    person: { id: string } | null;
    updateOk: boolean;
  }> = {},
) {
  const existing =
    over.existing === undefined ? { id: "meet_1" } : over.existing;

  return {
    meetings: {
      findMeetingByIdForOrg: jest.fn().mockResolvedValue(existing),
      updateMeeting: jest.fn().mockResolvedValue(over.updateOk ?? true),
    },
    contacts: {
      findById: jest.fn().mockResolvedValue(over.person ?? null),
    },
  };
}

describe("updateMeetingForOrg", () => {
  it("returns NO_ACTIVE_ORG when organizationId is null", async () => {
    const result = await updateMeetingForOrg(makeDeps() as never, {
      ...baseInput,
      organizationId: null,
    });
    expect(result).toEqual({ ok: false, error: "NO_ACTIVE_ORG" });
  });

  it("returns NOT_FOUND when meeting does not exist", async () => {
    const deps = makeDeps({ existing: null });
    const result = await updateMeetingForOrg(deps as never, baseInput);
    expect(result).toEqual({ ok: false, error: "NOT_FOUND" });
    expect(deps.meetings.updateMeeting).not.toHaveBeenCalled();
  });

  it("returns INVALID_PERSON when personId does not exist in org", async () => {
    const deps = makeDeps();
    const result = await updateMeetingForOrg(deps as never, {
      ...baseInput,
      personId: "person_missing",
    });
    expect(result).toEqual({ ok: false, error: "INVALID_PERSON" });
  });

  it("updates meeting with trimmed transcript and notes", async () => {
    const deps = makeDeps({ person: { id: "person_1" } });
    const result = await updateMeetingForOrg(deps as never, {
      ...baseInput,
      personId: "person_1",
      feeling: 4,
    });
    expect(result).toEqual({ ok: true, meetingId: "meet_1" });
    expect(deps.meetings.updateMeeting).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "meet_1",
        organizationId: "org_1",
        personId: "person_1",
        prospectName: "Acme Corp",
        transcript: "Bonjour, merci pour ce RDV.",
        notes: "note",
        feeling: 4,
      }),
    );
  });

  it("returns NOT_FOUND when repository update fails", async () => {
    const deps = makeDeps({ updateOk: false });
    const result = await updateMeetingForOrg(deps as never, baseInput);
    expect(result).toEqual({ ok: false, error: "NOT_FOUND" });
  });
});
