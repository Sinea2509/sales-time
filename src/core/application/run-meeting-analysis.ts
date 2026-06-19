import { DEFAULT_ANALYSIS_PROMPT_MARKDOWN } from "@/lib/default-analysis-prompts";
import { resolveMeetingTranscriptForAnalysis } from "@/lib/meeting-transcript-for-analysis";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type {
  MeetingAnalysisKind,
  MeetingRepositoryPort,
} from "@/src/core/ports/meeting-repository-port";
import type {
  AnalysisKindSlug,
  PromptTemplateRepositoryPort,
} from "@/src/core/ports/prompt-template-repository-port";

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

export type AnalysisKindToRun = MeetingAnalysisKind;

async function resolvePromptVersion(
  prompts: PromptTemplateRepositoryPort,
  kind: AnalysisKindSlug,
) {
  const defaultMarkdown = DEFAULT_ANALYSIS_PROMPT_MARKDOWN[kind];
  if (!defaultMarkdown?.trim()) {
    return null;
  }
  return prompts.ensureCurrentVersion({ kind, defaultMarkdown });
}

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
    /** Suffixe markdown (paramètres org.) concaténé au prompt KISS global. */
    kissSystemMarkdownAppendix?: string | null;
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

  const transcriptForAnalysis = await resolveMeetingTranscriptForAnalysis({
    organizationId: input.organizationId,
    transcript: meeting.transcript,
    sourceBlobUrl: meeting.sourceBlobUrl,
    sourceType: meeting.sourceType,
  });

  let promptVersion;
  try {
    promptVersion = await resolvePromptVersion(deps.prompts, input.kind);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: "PROMPT_NOT_CONFIGURED", message };
  }
  if (!promptVersion) {
    return { ok: false, error: "PROMPT_NOT_CONFIGURED" };
  }

  try {
    if (input.kind === "SONCAS" || input.kind === "DISC") {
      const analyze =
        input.kind === "SONCAS"
          ? deps.analysis.analyzeSoncas
          : deps.analysis.analyzeDisc;
      const { result } = await analyze({
        systemMarkdown: promptVersion.markdown,
        transcript: transcriptForAnalysis,
        notes: meeting.notes,
        model: input.model,
      });
      const row = await deps.meetings.createAnalysis({
        meetingId: meeting.id,
        kind: input.kind,
        promptVersionId: promptVersion.id,
        model: input.model,
        result,
      });
      return { ok: true, analysisId: row.id };
    }

    if (input.kind !== "KISS") {
      const unhandledKind: never = input.kind;
      throw new Error(`Unhandled analysis kind: ${unhandledKind}`);
    }

    const [priorSoncas, priorDisc] = await Promise.all([
      deps.meetings.findLatestAnalysisForMeeting({
        meetingId: meeting.id,
        organizationId: input.organizationId,
        kind: "SONCAS",
      }),
      deps.meetings.findLatestAnalysisForMeeting({
        meetingId: meeting.id,
        organizationId: input.organizationId,
        kind: "DISC",
      }),
    ]);

    const appendix = input.kissSystemMarkdownAppendix?.trim();
    const kissSystemMarkdown =
      appendix && appendix.length > 0
        ? `${promptVersion.markdown}\n\n---\n\n## Consignes KISS (plateforme)\n\n${appendix}`
        : promptVersion.markdown;

    const { result } = await deps.analysis.analyzeKiss({
      systemMarkdown: kissSystemMarkdown,
      transcript: transcriptForAnalysis,
      notes: meeting.notes,
      model: input.model,
      priorSoncasResult: priorSoncas?.result,
      priorDiscResult: priorDisc?.result,
    });
    const row = await deps.meetings.createAnalysis({
      meetingId: meeting.id,
      kind: "KISS",
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
