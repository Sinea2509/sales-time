import { describe, expect, it, jest } from "@jest/globals";
import { AUDIO_MAX_BYTES } from "@/lib/audio-transcript";
import { createMeetingFromRecording } from "./create-meeting-from-recording";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- jest mock
type JestFn = jest.Mock<any>;

const LONG_TRANSCRIPT =
  "Commercial : bonjour, merci de me recevoir. Prospect : avec plaisir, parlons de votre offre. ".repeat(
    20,
  );

const AUDIO_URL =
  "https://store.public.blob.vercel-storage.com/orgs/org_1/meetings/audio/rdv-abc.m4a";

const input = {
  organizationId: "org_1",
  sellerInternalUserId: "user_1",
  audioBlobUrl: AUDIO_URL,
  audioMediaType: "audio/mp4",
  personId: null,
  prospectName: "Claire Morel",
  meetingAt: new Date("2026-11-09T09:00:00.000Z"),
  durationMin: 52,
  outcome: null,
  notes: null,
  meetingTypeOptions: ["Découverte", "Closing"],
};

function makeDeps(
  over: Partial<{
    existing: string | null;
    trialLeft: number;
    planUnlocked: boolean;
    audioBytes: number;
    transcript: string;
    suggestion: Record<string, unknown>;
  }> = {},
) {
  const deps = {
    meetings: {
      createMeeting: jest.fn() as JestFn,
      findMeetingIdBySourceBlobUrlForOrg: jest.fn() as JestFn,
    },
    contacts: {
      findById: jest.fn() as JestFn,
      findUniqueByCompanyName: jest.fn() as JestFn,
    },
    analysisJobs: { enqueueMeetingAnalysis: jest.fn() as JestFn },
    organizationQuota: {
      getTrialAnalysesLeft: jest.fn() as JestFn,
      isPlanUnlocked: jest.fn() as JestFn,
      decrementTrialAnalysesLeft: jest.fn() as JestFn,
    },
    aiSummaryCache: { invalidateForOrganization: jest.fn() as JestFn },
    analysis: {
      transcribeAudio: jest.fn() as JestFn,
      suggestMeetingFacts: jest.fn() as JestFn,
    },
    fetchAudio: jest.fn() as JestFn,
    prefillWithModel: true,
  };
  deps.meetings.findMeetingIdBySourceBlobUrlForOrg.mockResolvedValue(
    over.existing ?? null,
  );
  deps.meetings.createMeeting.mockResolvedValue({ id: "meet_new" });
  deps.contacts.findById.mockResolvedValue({ id: "person_1" });
  deps.contacts.findUniqueByCompanyName.mockResolvedValue(null);
  deps.analysisJobs.enqueueMeetingAnalysis.mockResolvedValue(undefined);
  deps.organizationQuota.isPlanUnlocked.mockResolvedValue(
    over.planUnlocked ?? false,
  );
  deps.organizationQuota.getTrialAnalysesLeft.mockResolvedValue(
    over.trialLeft ?? 5,
  );
  deps.organizationQuota.decrementTrialAnalysesLeft.mockResolvedValue(
    undefined,
  );
  deps.aiSummaryCache.invalidateForOrganization.mockResolvedValue(undefined);
  deps.fetchAudio.mockResolvedValue({
    bytes: new Uint8Array(over.audioBytes ?? 14 * 1024 * 1024),
    contentType: "audio/mp4",
  });
  deps.analysis.transcribeAudio.mockResolvedValue({
    text: over.transcript ?? LONG_TRANSCRIPT,
  });
  deps.analysis.suggestMeetingFacts.mockResolvedValue(
    over.suggestion ?? {
      prospectName: "Claire Morel",
      meetingType: "Découverte",
      outcome: "FOLLOW_UP",
      potentialAmount: 12000,
    },
  );
  return deps;
}

describe("createMeetingFromRecording", () => {
  it("transcrit l'enregistrement, préremplit la fiche et met l'analyse en file", async () => {
    const deps = makeDeps();

    const result = await createMeetingFromRecording(deps as never, input);

    expect(result).toEqual({
      ok: true,
      meetingId: "meet_new",
      alreadyCreated: false,
    });
    expect(deps.fetchAudio).toHaveBeenCalledWith({
      organizationId: "org_1",
      blobUrl: AUDIO_URL,
    });
    const created = deps.meetings.createMeeting.mock.calls[0]?.[0];
    expect(created).toMatchObject({
      organizationId: "org_1",
      sellerUserId: "user_1",
      prospectName: "Claire Morel",
      durationMin: 52,
      meetingType: "Découverte",
      outcome: "FOLLOW_UP",
      potentialAmount: 12000,
      sourceType: "UPLOAD",
      sourceBlobUrl: AUDIO_URL,
      status: "PROCESSING",
    });
    expect(deps.analysisJobs.enqueueMeetingAnalysis).toHaveBeenCalledWith({
      organizationId: "org_1",
      meetingId: "meet_new",
    });
  });

  it("garde l'issue choisie par le commercial plutôt que celle lue dans la conversation", async () => {
    const deps = makeDeps();

    await createMeetingFromRecording(deps as never, {
      ...input,
      outcome: "WON",
    });

    expect(deps.meetings.createMeeting.mock.calls[0]?.[0]).toMatchObject({
      outcome: "WON",
    });
  });

  it("classe l'issue en Autre quand ni le commercial ni la conversation ne la donnent", async () => {
    const deps = makeDeps({ suggestion: { outcome: null } });

    await createMeetingFromRecording(deps as never, input);

    expect(deps.meetings.createMeeting.mock.calls[0]?.[0]).toMatchObject({
      outcome: "OTHER",
    });
  });

  it("rend la fiche existante sans retranscrire quand le même fichier revient", async () => {
    const deps = makeDeps({ existing: "meet_old" });

    const result = await createMeetingFromRecording(deps as never, input);

    expect(result).toEqual({
      ok: true,
      meetingId: "meet_old",
      alreadyCreated: true,
    });
    expect(deps.analysis.transcribeAudio).not.toHaveBeenCalled();
    expect(deps.meetings.createMeeting).not.toHaveBeenCalled();
  });

  it("refuse avant de transcrire quand l'essai est épuisé", async () => {
    const deps = makeDeps({ trialLeft: 0 });

    const result = await createMeetingFromRecording(deps as never, input);

    expect(result).toEqual({ ok: false, error: "QUOTA_EXHAUSTED" });
    expect(deps.fetchAudio).not.toHaveBeenCalled();
    expect(deps.analysis.transcribeAudio).not.toHaveBeenCalled();
  });

  it("transcrit sans regarder l'essai quand l'organisation a un abonnement", async () => {
    const deps = makeDeps({ trialLeft: 0, planUnlocked: true });

    const result = await createMeetingFromRecording(deps as never, input);

    expect(result.ok).toBe(true);
  });

  it("ne crée rien quand le fichier dépasse la taille acceptée", async () => {
    const deps = makeDeps({ audioBytes: AUDIO_MAX_BYTES + 1 });

    const result = await createMeetingFromRecording(deps as never, input);

    expect(result).toEqual({ ok: false, error: "AUDIO_TOO_LARGE" });
    expect(deps.meetings.createMeeting).not.toHaveBeenCalled();
  });

  it("ne crée rien quand la conversation est trop courte pour être analysée", async () => {
    const deps = makeDeps({ transcript: "Allô ?" });

    const result = await createMeetingFromRecording(deps as never, input);

    expect(result).toEqual({
      ok: false,
      error: "TRANSCRIPT_TOO_SHORT_FOR_ANALYSIS",
    });
    expect(deps.meetings.createMeeting).not.toHaveBeenCalled();
  });

  it("rattache le rendez-vous au contact choisi sur le téléphone", async () => {
    const deps = makeDeps();

    await createMeetingFromRecording(deps as never, {
      ...input,
      personId: "person_1",
    });

    expect(deps.contacts.findById).toHaveBeenCalledWith(
      expect.objectContaining({ id: "person_1", organizationId: "org_1" }),
    );
    expect(deps.meetings.createMeeting.mock.calls[0]?.[0]).toMatchObject({
      personId: "person_1",
    });
  });

  it("refuse un contact que le commercial ne voit pas", async () => {
    const deps = makeDeps();
    deps.contacts.findById.mockResolvedValue(null);

    const result = await createMeetingFromRecording(deps as never, {
      ...input,
      personId: "person_autre",
    });

    expect(result).toEqual({ ok: false, error: "INVALID_PERSON" });
    expect(deps.meetings.createMeeting).not.toHaveBeenCalled();
  });

  it("crée la fiche même quand la lecture de la conversation échoue", async () => {
    const deps = makeDeps();
    deps.analysis.suggestMeetingFacts.mockRejectedValue(new Error("panne"));

    const result = await createMeetingFromRecording(deps as never, input);

    expect(result.ok).toBe(true);
    expect(deps.meetings.createMeeting.mock.calls[0]?.[0]).toMatchObject({
      meetingType: null,
      outcome: "OTHER",
    });
  });
});
