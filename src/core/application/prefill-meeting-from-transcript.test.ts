import { describe, expect, it, jest } from "@jest/globals";
import {
  MEETING_PREFILL_MODEL,
  prefillMeetingFromTranscript,
} from "./prefill-meeting-from-transcript";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { MeetingFactsSuggestion } from "@/src/core/domain/meeting-prefill";

const OPTIONS = ["Découverte", "Proposition", "Closing"];

const TEAMS_TRANSCRIPT = [
  "Point avec Durand SA",
  "29 septembre 2026, 01:09PM",
  "54min 42sec",
  "Commercial : Bonjour Madame Durand, merci de me recevoir.",
  "Prospect : Bonjour, je vous en prie.",
].join("\n");

function analysisReturning(
  suggestion: MeetingFactsSuggestion | Error,
): AnalysisPort {
  const suggestMeetingFacts = jest.fn(() =>
    suggestion instanceof Error
      ? Promise.reject(suggestion)
      : Promise.resolve(suggestion),
  );
  return { suggestMeetingFacts } as unknown as AnalysisPort;
}

describe("prefillMeetingFromTranscript", () => {
  it("assemble l'en-tête de la transcription et ce que lit le modèle", async () => {
    const analysis = analysisReturning({
      prospectName: "Claire Durand",
      prospectCompany: "Durand SA",
      meetingType: "découverte",
      outcome: "FOLLOW_UP",
      potentialAmount: 12000,
    });
    const prefill = await prefillMeetingFromTranscript(
      { analysis },
      { transcript: TEAMS_TRANSCRIPT, meetingTypeOptions: OPTIONS },
    );
    expect(prefill).toEqual({
      prospectName: "Claire Durand",
      meetingType: "Découverte",
      outcome: "FOLLOW_UP",
      potentialAmount: 12000,
      meetingDate: "2026-09-29",
      durationMin: 55,
    });
    const call = (analysis.suggestMeetingFacts as jest.Mock).mock
      .calls[0][0] as { model: string; meetingTypeOptions: string[] };
    expect(call.model).toBe(MEETING_PREFILL_MODEL);
    expect(call.meetingTypeOptions).toEqual(OPTIONS);
  });

  it("garde l'en-tête quand le modèle échoue", async () => {
    const prefill = await prefillMeetingFromTranscript(
      { analysis: analysisReturning(new Error("boom")) },
      { transcript: TEAMS_TRANSCRIPT, meetingTypeOptions: OPTIONS },
    );
    expect(prefill.prospectName).toBeNull();
    expect(prefill.meetingDate).toBe("2026-09-29");
  });

  it("n'attend pas un modèle trop lent", async () => {
    const analysis = {
      suggestMeetingFacts: () => new Promise(() => {}),
    } as unknown as AnalysisPort;
    const prefill = await prefillMeetingFromTranscript(
      { analysis, timeoutMs: 10 },
      { transcript: "Commercial : Bonjour.", meetingTypeOptions: OPTIONS },
    );
    expect(prefill.prospectName).toBeNull();
    expect(prefill.meetingType).toBeNull();
  });
});
