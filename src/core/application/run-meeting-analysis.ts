import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";

export type RunMeetingAnalysisResult =
  | { ok: true; analysisId: string }
  | {
      ok: false;
      error:
        | "NO_ACTIVE_ORG"
        | "MEETING_NOT_FOUND"
        | "PROMPT_NOT_CONFIGURED"
        | "ANALYSIS_FAILED";
      message?: string;
    };

export type AnalysisKindToRun = "SONCAS" | "DISC";

export async function runMeetingAnalysis(
  deps: {
    meetings: MeetingRepositoryPort;
    prompts: PromptTemplateRepositoryPort;
    analysis: AnalysisPort;
  },
  input: {
    organizationId: string | null;
    meetingId: string;
    kind: AnalysisKindToRun;
    model: string;
  },
): Promise<RunMeetingAnalysisResult> {
  if (!input.organizationId) {
    return { ok: false, error: "NO_ACTIVE_ORG" };
  }

  const meeting = await deps.meetings.findMeetingByIdForOrg({
    id: input.meetingId,
    organizationId: input.organizationId,
  });
  if (!meeting) {
    return { ok: false, error: "MEETING_NOT_FOUND" };
  }

  const promptVersion = await deps.prompts.getCurrentVersion({
    kind: input.kind,
  });
  if (!promptVersion) {
    return { ok: false, error: "PROMPT_NOT_CONFIGURED" };
  }

  try {
    if (input.kind === "SONCAS") {
      const { result } = await deps.analysis.analyzeSoncas({
        systemMarkdown: promptVersion.markdown,
        transcript: meeting.transcript,
        notes: meeting.notes,
        model: input.model,
      });
      const row = await deps.meetings.createAnalysis({
        meetingId: meeting.id,
        kind: "SONCAS",
        promptVersionId: promptVersion.id,
        model: input.model,
        result,
      });
      return { ok: true, analysisId: row.id };
    }

    const { result } = await deps.analysis.analyzeDisc({
      systemMarkdown: promptVersion.markdown,
      transcript: meeting.transcript,
      notes: meeting.notes,
      model: input.model,
    });
    const row = await deps.meetings.createAnalysis({
      meetingId: meeting.id,
      kind: "DISC",
      promptVersionId: promptVersion.id,
      model: input.model,
      result,
    });
    return { ok: true, analysisId: row.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: "ANALYSIS_FAILED", message };
  }
}
