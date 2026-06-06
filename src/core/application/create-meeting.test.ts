import { describe, expect, it } from "@jest/globals";
import { createMeetingForOrg } from "./create-meeting";

const baseInput = {
  organizationId: "org_1",
  sellerInternalUserId: "user_1",
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

function makeDeps(over: Partial<{
  trialLeft: number;
  person: { id: string } | null;
  meetingId: string;
}> = {}) {
  return {
    meetings: {
      createMeeting: jest.fn().mockResolvedValue({
        id: over.meetingId ?? "meet_1",
      }),
    },
    contacts: {
      findById: jest.fn().mockResolvedValue(over.person ?? null),
    },
    analysisJobs: {
      enqueueMeetingAnalysis: jest.fn().mockResolvedValue(undefined),
    },
    organizationQuota: {
      getTrialAnalysesLeft: jest
        .fn()
        .mockResolvedValue(over.trialLeft ?? 3),
      decrementTrialAnalysesLeft: jest.fn().mockResolvedValue(undefined),
    },
  };
}

describe("createMeetingForOrg", () => {
  it("returns NO_ACTIVE_ORG when organizationId is null", async () => {
    const result = await createMeetingForOrg(makeDeps() as never, {
      ...baseInput,
      organizationId: null,
    });
    expect(result).toEqual({ ok: false, error: "NO_ACTIVE_ORG" });
  });

  it("returns NO_INTERNAL_USER when seller is null", async () => {
    const result = await createMeetingForOrg(makeDeps() as never, {
      ...baseInput,
      sellerInternalUserId: null,
    });
    expect(result).toEqual({ ok: false, error: "NO_INTERNAL_USER" });
  });

  it("returns QUOTA_EXHAUSTED when trial analyses are depleted", async () => {
    const deps = makeDeps({ trialLeft: 0 });
    const result = await createMeetingForOrg(deps as never, baseInput);
    expect(result).toEqual({ ok: false, error: "QUOTA_EXHAUSTED" });
    expect(deps.meetings.createMeeting).not.toHaveBeenCalled();
  });

  it("returns INVALID_PERSON when personId does not exist in org", async () => {
    const deps = makeDeps();
    const result = await createMeetingForOrg(deps as never, {
      ...baseInput,
      personId: "person_missing",
    });
    expect(result).toEqual({ ok: false, error: "INVALID_PERSON" });
  });

  it("creates meeting, decrements quota, and enqueues analysis by default", async () => {
    const deps = makeDeps({ person: { id: "person_1" }, meetingId: "meet_99" });
    const result = await createMeetingForOrg(deps as never, {
      ...baseInput,
      personId: "person_1",
      feeling: 4,
      sourceType: "UPLOAD",
      sourceBlobUrl: "https://blob.example/transcript.txt",
    });

    expect(result).toEqual({ ok: true, meetingId: "meet_99" });
    expect(deps.meetings.createMeeting).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_1",
        sellerUserId: "user_1",
        personId: "person_1",
        prospectName: "Acme Corp",
        transcript: "Bonjour, merci pour ce RDV.",
        notes: "note",
        feeling: 4,
        sourceType: "UPLOAD",
        sourceBlobUrl: "https://blob.example/transcript.txt",
        status: "PROCESSING",
      }),
    );
    expect(deps.organizationQuota.decrementTrialAnalysesLeft).toHaveBeenCalledWith(
      "org_1",
    );
    expect(deps.analysisJobs.enqueueMeetingAnalysis).toHaveBeenCalledWith({
      organizationId: "org_1",
      meetingId: "meet_99",
    });
  });

  it("skips quota and queue when enqueueAnalysis is false", async () => {
    const deps = makeDeps({ trialLeft: 0 });
    const result = await createMeetingForOrg(deps as never, {
      ...baseInput,
      enqueueAnalysis: false,
    });

    expect(result.ok).toBe(true);
    expect(deps.organizationQuota.getTrialAnalysesLeft).not.toHaveBeenCalled();
    expect(deps.meetings.createMeeting).toHaveBeenCalledWith(
      expect.objectContaining({ status: "PENDING" }),
    );
    expect(deps.analysisJobs.enqueueMeetingAnalysis).not.toHaveBeenCalled();
  });
});
