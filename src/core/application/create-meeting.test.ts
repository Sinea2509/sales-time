import { describe, expect, it, jest } from "@jest/globals";
import { createMeetingForOrg } from "./create-meeting";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- jest mock
type JestFn = jest.Mock<any>;

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

function makeDeps() {
  return {
    meetings: {
      createMeeting: jest.fn() as JestFn,
    },
    contacts: {
      findById: jest.fn() as JestFn,
      findUniqueByCompanyName: jest.fn() as JestFn,
    },
    analysisJobs: {
      enqueueMeetingAnalysis: jest.fn() as JestFn,
    },
    organizationQuota: {
      getTrialAnalysesLeft: jest.fn() as JestFn,
      isPlanUnlocked: jest.fn() as JestFn,
      decrementTrialAnalysesLeft: jest.fn() as JestFn,
    },
    aiSummaryCache: {
      invalidateForOrganization: jest.fn() as JestFn,
    },
  };
}

function initDeps(
  over: Partial<{
    trialLeft: number;
    planUnlocked: boolean;
    person: { id: string } | null;
    meetingId: string;
  }> = {},
) {
  const deps = makeDeps();
  deps.meetings.createMeeting.mockResolvedValue({
    id: over.meetingId ?? "meet_1",
  });
  deps.contacts.findById.mockResolvedValue(over.person ?? null);
  deps.contacts.findUniqueByCompanyName.mockResolvedValue(null);
  deps.analysisJobs.enqueueMeetingAnalysis.mockResolvedValue(undefined);
  deps.organizationQuota.isPlanUnlocked.mockResolvedValue(
    over.planUnlocked ?? false,
  );
  deps.organizationQuota.getTrialAnalysesLeft.mockResolvedValue(
    over.trialLeft ?? 3,
  );
  deps.organizationQuota.decrementTrialAnalysesLeft.mockResolvedValue(undefined);
  deps.aiSummaryCache.invalidateForOrganization.mockResolvedValue(undefined);
  return deps;
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
    const deps = initDeps({ trialLeft: 0 });
    const result = await createMeetingForOrg(deps as never, baseInput);
    expect(result).toEqual({ ok: false, error: "QUOTA_EXHAUSTED" });
    expect(deps.meetings.createMeeting).not.toHaveBeenCalled();
  });

  it("allows analysis when plan is unlocked even with zero trial left", async () => {
    const deps = initDeps({ trialLeft: 0, planUnlocked: true, meetingId: "meet_paid" });
    const result = await createMeetingForOrg(deps as never, baseInput);
    expect(result).toEqual({ ok: true, meetingId: "meet_paid" });
    expect(deps.organizationQuota.getTrialAnalysesLeft).not.toHaveBeenCalled();
    expect(deps.organizationQuota.decrementTrialAnalysesLeft).not.toHaveBeenCalled();
  });

  it("returns INVALID_PERSON when personId does not exist in org", async () => {
    const deps = initDeps();
    const result = await createMeetingForOrg(deps as never, {
      ...baseInput,
      personId: "person_missing",
    });
    expect(result).toEqual({ ok: false, error: "INVALID_PERSON" });
  });

  it("creates meeting with PROCESSING status and decrements quota by default", async () => {
    const deps = initDeps({ person: { id: "person_1" }, meetingId: "meet_99" });
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

  it("links meeting to contact when prospect name matches a unique company", async () => {
    const deps = initDeps({ meetingId: "meet_co" });
    deps.contacts.findUniqueByCompanyName.mockResolvedValue({
      id: "person_margaux",
      displayName: "Margaux JULIEN",
      company: "Doha",
    });
    deps.contacts.findById.mockResolvedValue({
      id: "person_margaux",
      displayName: "Margaux JULIEN",
      company: "Doha",
    });

    const result = await createMeetingForOrg(deps as never, {
      ...baseInput,
      prospectName: "Doha",
    });

    expect(result).toEqual({ ok: true, meetingId: "meet_co" });
    expect(deps.meetings.createMeeting).toHaveBeenCalledWith(
      expect.objectContaining({
        personId: "person_margaux",
        prospectName: "Margaux JULIEN",
      }),
    );
  });

  it("skips quota and queue when enqueueAnalysis is false", async () => {
    const deps = initDeps({ trialLeft: 0 });
    const result = await createMeetingForOrg(deps as never, {
      ...baseInput,
      enqueueAnalysis: false,
    });

    expect(result.ok).toBe(true);
    expect(deps.organizationQuota.isPlanUnlocked).not.toHaveBeenCalled();
    expect(deps.organizationQuota.getTrialAnalysesLeft).not.toHaveBeenCalled();
    expect(deps.meetings.createMeeting).toHaveBeenCalledWith(
      expect.objectContaining({ status: "PENDING" }),
    );
    expect(deps.analysisJobs.enqueueMeetingAnalysis).not.toHaveBeenCalled();
  });
});
