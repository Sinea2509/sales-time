import { withProspectProfileSystemPrompt } from "@/lib/ai-system-prompt";
import { resolvePromptGatewayModel } from "@/lib/load-analysis-model";
import { buildDelimitedMeetingUserContent } from "@/lib/meeting-text-for-ai-prompt";
import { resolveMeetingTranscriptForAnalysis } from "@/lib/meeting-transcript-for-analysis";
import {
  recordAiRequestError,
  recordAiRequestSuccess,
} from "@/lib/record-ai-request-log";
import { meetingAnalysisContext } from "@/src/core/domain/meeting-analysis-context";
import { markObjectionsVerbatim } from "@/src/core/domain/objections-verbatim";
import { aiLogPromptVersionLabel } from "@/src/core/domain/organization-prompts";
import {
  discFromMoments,
  soncasFromMoments,
} from "@/src/core/domain/profile-moments";
import {
  PROSPECT_PROFILE_KINDS,
  type ProspectProfileGenerated,
  type ProspectProfileKind,
} from "@/src/core/domain/prospect-profile-zod";
import { scorecardGridForMeeting } from "@/src/core/domain/scorecard-grid-for-meeting";
import {
  talkShareFromTranscript,
  transcriptSides,
} from "@/src/core/domain/talk-share-from-transcript";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { AiRequestLogRepositoryPort } from "@/src/core/ports/ai-request-log-repository-port";
import type { AiSummaryCacheRepositoryPort } from "@/src/core/ports/ai-summary-cache-repository-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";
import type { OrganizationPromptRepositoryPort } from "@/src/core/ports/organization-prompt-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";
import { reuseAnalysisOutput } from "./reuse-analysis-output";
import { resolveAnalysisPrompt } from "./resolve-analysis-prompt";
import type { RunMeetingAnalysisResult } from "./run-meeting-analysis";

/** La clé sous laquelle une lecture du prospect est gardée pour être rendue à l'identique. */
const PROSPECT_PROFILE_REUSE_KIND = "PROSPECT_PROFILE";

/**
 * SONCAS, DISC et les objections, lus en un seul appel au modèle.
 *
 * Chaque analyse garde sa consigne (celle de l'organisation, sinon celle du
 * super admin) et s'enregistre à part, comme lorsqu'elle avait son propre
 * appel : la fiche, KISS et le compte rendu les relisent sans rien savoir de
 * la fusion. Le modèle employé est celui réglé pour SONCAS.
 *
 * L'appel est journalisé une seule fois, sous SONCAS, avec la consigne
 * assemblée telle qu'elle est partie.
 */
export async function runProspectProfileAnalysis(
  deps: {
    meetings: MeetingRepositoryPort;
    prompts: PromptTemplateRepositoryPort;
    organizationPrompts: OrganizationPromptRepositoryPort;
    analysis: AnalysisPort;
    aiLogs?: AiRequestLogRepositoryPort;
    aiSummaryCache?: AiSummaryCacheRepositoryPort;
  },
  input: {
    organizationId: string;
    meetingId: string;
    jobId?: string | null;
    organizationPlaybookMarkdown?: string | null;
  },
): Promise<Record<ProspectProfileKind, RunMeetingAnalysisResult>> {
  const failAll = (
    error: Extract<RunMeetingAnalysisResult, { ok: false }>,
  ): Record<ProspectProfileKind, RunMeetingAnalysisResult> => ({
    SONCAS: error,
    DISC: error,
    OBJECTIONS: error,
  });

  const meeting = await deps.meetings.findMeetingByIdForOrg({
    id: input.meetingId,
    organizationId: input.organizationId,
  });
  if (!meeting) return failAll({ ok: false, error: "MEETING_NOT_FOUND" });

  let prompts;
  try {
    prompts = await Promise.all(
      PROSPECT_PROFILE_KINDS.map((kind) =>
        resolveAnalysisPrompt(deps, {
          kind,
          organizationId: input.organizationId,
          ensureGlobalVersion: true,
        }),
      ),
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return failAll({ ok: false, error: "PROMPT_NOT_CONFIGURED", message });
  }
  const [soncasPrompt, discPrompt, objectionsPrompt] = prompts;
  if (prompts.some((p) => !p.globalVersion)) {
    return failAll({ ok: false, error: "PROMPT_NOT_CONFIGURED" });
  }

  const transcript = await resolveMeetingTranscriptForAnalysis({
    organizationId: input.organizationId,
    transcript: meeting.transcript,
    sourceBlobUrl: meeting.sourceBlobUrl,
    sourceType: meeting.sourceType,
  });
  const evidenceSource = [transcript, meeting.notes ?? ""].join("\n");
  /* Le nom du commercial aide à le reconnaître, comme pour la grille (lot 92). */
  const speakerHints = {
    sellerName: meeting.sellerName,
    prospectNames: [meeting.prospectName],
  };
  const sides = transcriptSides(transcript, speakerHints);

  const systemPrompt = withProspectProfileSystemPrompt({
    soncasMarkdown: soncasPrompt.markdown,
    discMarkdown: discPrompt.markdown,
    objectionsMarkdown: objectionsPrompt.markdown,
    contextBlocks: [
      input.organizationPlaybookMarkdown,
      meetingAnalysisContext({
        meetingType: meeting.meetingType ?? null,
        pipelineStage: meeting.pipelineStage ?? null,
        grid: scorecardGridForMeeting({
          meetingType: meeting.meetingType,
          pipelineStage: meeting.pipelineStage,
        }),
        talkShare: talkShareFromTranscript(transcript, speakerHints),
      }),
    ],
  });
  const userPrompt = buildDelimitedMeetingUserContent({
    transcript,
    notes: meeting.notes,
  });
  const model = await resolvePromptGatewayModel(deps.prompts, "SONCAS");
  const logBase = {
    organizationId: input.organizationId,
    meetingId: meeting.id,
    jobId: input.jobId ?? null,
    kind: "SONCAS" as const,
    modelName: model,
    promptVersion: PROSPECT_PROFILE_KINDS.map(
      (kind, i) =>
        `${kind}:${aiLogPromptVersionLabel({
          globalVersion: prompts[i].globalVersion!.version,
          organizationPromptVersionId: prompts[i].organizationPromptVersionId,
        })}`,
    ).join(" "),
    systemPrompt,
    userPrompt,
  };
  const started = Date.now();

  let generated: ProspectProfileGenerated;
  try {
    const { value: out, reused } = await reuseAnalysisOutput(deps, {
      organizationId: input.organizationId,
      kind: PROSPECT_PROFILE_REUSE_KIND,
      model,
      systemPrompt,
      userPrompt,
      compute: async () => {
        const o = await deps.analysis.analyzeProspectProfile({
          systemPrompt,
          transcript,
          notes: meeting.notes,
          model,
        });
        return { result: o.result, usage: o.usage ?? null };
      },
    });
    if (!reused) {
      await recordAiRequestSuccess(deps.aiLogs, logBase, {
        rawOutput: out.result,
        inputTokens: out.usage?.inputTokens ?? null,
        outputTokens: out.usage?.outputTokens ?? null,
        latencyMs: Date.now() - started,
      });
    }
    generated = out.result;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await recordAiRequestError(deps.aiLogs, logBase, {
      errorMessage: message,
      latencyMs: Date.now() - started,
    });
    return failAll({ ok: false, error: "ANALYSIS_FAILED", message });
  }

  /*
    Les mêmes règles que pour les appels séparés : les passages SONCAS et DISC
    se vérifient dans les paroles du prospect, et les objections retrouvées mot
    pour mot sont marquées.
  */
  const prospectText = sides?.prospect ?? evidenceSource;
  const results: Record<ProspectProfileKind, unknown> = {
    SONCAS: soncasFromMoments(
      generated.soncas,
      prospectText,
      sides?.seller ?? null,
    ),
    DISC: discFromMoments(generated.disc, prospectText),
    OBJECTIONS: markObjectionsVerbatim(generated.objections, prospectText),
  };

  const outcome = {} as Record<ProspectProfileKind, RunMeetingAnalysisResult>;
  for (const [i, kind] of PROSPECT_PROFILE_KINDS.entries()) {
    try {
      const row = await deps.meetings.createAnalysis({
        meetingId: meeting.id,
        kind,
        promptVersionId: prompts[i].globalVersion!.id,
        organizationPromptVersionId: prompts[i].organizationPromptVersionId,
        model,
        result: results[kind],
      });
      outcome[kind] = { ok: true, analysisId: row.id };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      outcome[kind] = { ok: false, error: "ANALYSIS_FAILED", message };
    }
  }
  return outcome;
}
