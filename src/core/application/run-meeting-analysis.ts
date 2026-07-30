import { withDataScopeSystemPrompt } from "@/lib/ai-system-prompt";
import { DEFAULT_ANALYSIS_PROMPT_MARKDOWN } from "@/lib/default-analysis-prompts";
import { resolvePromptGatewayModel } from "@/lib/load-analysis-model";
import {
  buildDelimitedMeetingUserContent,
  buildKissUserPrompt,
} from "@/lib/meeting-text-for-ai-prompt";
import { resolveMeetingTranscriptForAnalysis } from "@/lib/meeting-transcript-for-analysis";
import {
  recordAiRequestError,
  recordAiRequestSuccess,
} from "@/lib/record-ai-request-log";
import {
  analysisSystemBlock,
  composeAnalysisSystemMarkdown,
  KISS_PLATFORM_BLOCK_HEADING,
} from "@/src/core/domain/analysis-system-markdown";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type {
  AiCallKind,
  AiRequestLogRepositoryPort,
} from "@/src/core/ports/ai-request-log-repository-port";
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

function aiLogKind(kind: AnalysisKindToRun): AiCallKind {
  return kind === "KISS" ? "COACHING" : kind;
}

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
    aiLogs?: AiRequestLogRepositoryPort;
  },
  input: {
    organizationId: string | null;
    meetingId: string;
    kind: AnalysisKindToRun;
    jobId?: string | null;
    /** Suffixe markdown (paramètres org.) concaténé au prompt KISS global. */
    kissSystemMarkdownAppendix?: string | null;
    /**
     * Bloc playbook de l'organisation, ajouté aux trois analyses.
     *
     * SONCAS et DISC ne recevaient jusqu'ici aucun contexte d'entreprise : le
     * modèle jugeait la découverte d'un prospect sans savoir ce qui se vend,
     * à qui, ni ce que la maison interdit de promettre.
     */
    organizationPlaybookMarkdown?: string | null;
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
    if (deps.aiLogs) {
      const model = await resolvePromptGatewayModel(deps.prompts, input.kind).catch(
        () => "unknown",
      );
      await recordAiRequestError(
        deps.aiLogs,
        {
          organizationId: input.organizationId,
          meetingId: meeting.id,
          jobId: input.jobId ?? null,
          kind: aiLogKind(input.kind),
          modelName: model,
          promptVersion: "0",
          systemPrompt: "",
          userPrompt: "",
        },
        { errorMessage: message, latencyMs: 0 },
      );
    }
    return { ok: false, error: "PROMPT_NOT_CONFIGURED", message };
  }
  if (!promptVersion) {
    if (deps.aiLogs) {
      const model = await resolvePromptGatewayModel(deps.prompts, input.kind);
      await recordAiRequestError(
        deps.aiLogs,
        {
          organizationId: input.organizationId,
          meetingId: meeting.id,
          jobId: input.jobId ?? null,
          kind: aiLogKind(input.kind),
          modelName: model,
          promptVersion: "0",
          systemPrompt: "",
          userPrompt: "",
        },
        { errorMessage: "Prompt not configured", latencyMs: 0 },
      );
    }
    return { ok: false, error: "PROMPT_NOT_CONFIGURED" };
  }

  const model = await resolvePromptGatewayModel(deps.prompts, input.kind);

  try {
    if (input.kind === "SONCAS" || input.kind === "DISC") {
      const profileSystemMarkdown = composeAnalysisSystemMarkdown(
        promptVersion.markdown,
        [input.organizationPlaybookMarkdown],
      );
      const systemPrompt = withDataScopeSystemPrompt(profileSystemMarkdown);
      const userPrompt = buildDelimitedMeetingUserContent({
        transcript: transcriptForAnalysis,
        notes: meeting.notes,
      });
      const logBase = {
        organizationId: input.organizationId,
        meetingId: meeting.id,
        jobId: input.jobId ?? null,
        kind: aiLogKind(input.kind),
        modelName: model,
        promptVersion: String(promptVersion.version),
        systemPrompt,
        userPrompt,
      };
      const started = Date.now();

      const analyze =
        input.kind === "SONCAS"
          ? deps.analysis.analyzeSoncas
          : deps.analysis.analyzeDisc;
      try {
        const out = await analyze({
          systemMarkdown: profileSystemMarkdown,
          transcript: transcriptForAnalysis,
          notes: meeting.notes,
          model,
        });
        await recordAiRequestSuccess(deps.aiLogs, logBase, {
          rawOutput: out.result,
          inputTokens: out.usage?.inputTokens ?? null,
          outputTokens: out.usage?.outputTokens ?? null,
          latencyMs: Date.now() - started,
        });
        const row = await deps.meetings.createAnalysis({
          meetingId: meeting.id,
          kind: input.kind,
          promptVersionId: promptVersion.id,
          model,
          result: out.result,
        });
        return { ok: true, analysisId: row.id };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        await recordAiRequestError(deps.aiLogs, logBase, {
          errorMessage: message,
          latencyMs: Date.now() - started,
        });
        return { ok: false, error: "ANALYSIS_FAILED", message };
      }
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

    const kissSystemMarkdown = composeAnalysisSystemMarkdown(
      promptVersion.markdown,
      [
        analysisSystemBlock(
          KISS_PLATFORM_BLOCK_HEADING,
          input.kissSystemMarkdownAppendix,
        ),
        input.organizationPlaybookMarkdown,
      ],
    );
    const systemPrompt = withDataScopeSystemPrompt(kissSystemMarkdown);
    const userPrompt = buildKissUserPrompt({
      transcript: transcriptForAnalysis,
      notes: meeting.notes,
      priorSoncasResult: priorSoncas?.result,
      priorDiscResult: priorDisc?.result,
    });
    const logBase = {
      organizationId: input.organizationId,
      meetingId: meeting.id,
      jobId: input.jobId ?? null,
      kind: aiLogKind(input.kind),
      modelName: model,
      promptVersion: String(promptVersion.version),
      systemPrompt,
      userPrompt,
    };
    const started = Date.now();

    try {
      const out = await deps.analysis.analyzeKiss({
        systemMarkdown: kissSystemMarkdown,
        transcript: transcriptForAnalysis,
        notes: meeting.notes,
        model,
        priorSoncasResult: priorSoncas?.result,
        priorDiscResult: priorDisc?.result,
      });
      await recordAiRequestSuccess(deps.aiLogs, logBase, {
        rawOutput: out.result,
        inputTokens: out.usage?.inputTokens ?? null,
        outputTokens: out.usage?.outputTokens ?? null,
        latencyMs: Date.now() - started,
      });
      const row = await deps.meetings.createAnalysis({
        meetingId: meeting.id,
        kind: "KISS",
        promptVersionId: promptVersion.id,
        model,
        result: out.result,
      });
      return { ok: true, analysisId: row.id };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await recordAiRequestError(deps.aiLogs, logBase, {
        errorMessage: message,
        latencyMs: Date.now() - started,
      });
      return { ok: false, error: "ANALYSIS_FAILED", message };
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: "ANALYSIS_FAILED", message };
  }
}
