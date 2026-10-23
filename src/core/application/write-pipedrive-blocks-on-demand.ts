import { getEnv } from "@/lib/env";
import { resolvePromptGatewayModel } from "@/lib/load-analysis-model";
import { PIPEDRIVE_BLOCKS_SYSTEM_PROMPT } from "@/lib/pipedrive-blocks-prompt";
import { toAppTimeZoneDatetimeLocal } from "@/src/core/domain/app-time-zone";
import { salesScoreForMeeting } from "@/src/core/domain/dashboard-sales-score";
import { kissResultSchema } from "@/src/core/domain/kiss-result-zod";
import { challengesForDisplay } from "@/src/core/domain/meeting-challenges";
import { hasOrganizationFeature } from "@/src/core/domain/organization-features";
import {
  composePipedriveBlocks,
  pipedriveExtractionSchema,
  withVerifiedQuotes,
  type PipedriveBlocks,
} from "@/src/core/domain/pipedrive-blocks";
import { tierFromSalesScore } from "@/src/core/domain/team-ranking";
import {
  evidenceWords,
  isExcerptInSource,
} from "@/src/core/domain/transcript-evidence";
import type { AiSummaryCacheRepositoryPort } from "@/src/core/ports/ai-summary-cache-repository-port";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type {
  MeetingDetailWithAnalyses,
  MeetingRepositoryPort,
} from "@/src/core/ports/meeting-repository-port";
import type { OrganizationFeaturesRepositoryPort } from "@/src/core/ports/organization-features-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";
import { reuseAnalysisOutput } from "./reuse-analysis-output";

export type WritePipedriveBlocksResult =
  | { kind: "blocks"; blocks: PipedriveBlocks }
  | { kind: "not_enabled" }
  | { kind: "not_found" }
  | { kind: "not_ready" }
  | { kind: "failed" }
  | { kind: "unavailable"; reason: "AI_NOT_CONFIGURED" | "NO_TRANSCRIPT" };

/** Le même transcript est relu au plus sur cette longueur, comme le compte rendu. */
const TRANSCRIPT_MAX_CHARS = 60_000;

/**
 * Le rang du rendez-vous avec ce contact (R1, R2…) et le compte rendu du
 * rendez-vous précédent, qui porte ce que l'on savait déjà : c'est la
 * « mémoire SEED » de la méthode, reprise d'un rendez-vous à l'autre.
 */
async function loadContactHistory(
  deps: { meetings: MeetingRepositoryPort },
  input: { organizationId: string; meeting: MeetingDetailWithAnalyses },
): Promise<{ rank: number; previousReport: string | null }> {
  try {
    const history = await deps.meetings.listMeetingsForPersonOrdered({
      organizationId: input.organizationId,
      personId: input.meeting.personId,
      limit: 30,
    });
    const before = history
      .filter(
        (m) =>
          m.id !== input.meeting.id &&
          m.meetingAt.getTime() < input.meeting.meetingAt.getTime(),
      )
      .sort((a, b) => b.meetingAt.getTime() - a.meetingAt.getTime());
    const previous = before[0]
      ? await deps.meetings.findMeetingDetailWithAnalyses({
          id: before[0].id,
          organizationId: input.organizationId,
        })
      : null;
    return {
      rank: before.length + 1,
      previousReport: previous?.visitReportDraft?.trim() || null,
    };
  } catch {
    return { rank: 1, previousReport: null };
  }
}

/**
 * Les blocs Pipedrive d'un rendez-vous, lus à la demande à l'ouverture de
 * l'onglet, pour les seules organisations qui ont la fonctionnalité.
 *
 * La réponse du modèle est gardée dans le cache des analyses : rouvrir
 * l'onglet ne coûte pas un nouvel appel tant que le transcript ne change pas.
 */
export async function writePipedriveBlocksOnDemand(
  deps: {
    analysis: AnalysisPort;
    prompts: PromptTemplateRepositoryPort;
    meetings: MeetingRepositoryPort;
    organizationFeatures: OrganizationFeaturesRepositoryPort;
    aiSummaryCache?: AiSummaryCacheRepositoryPort;
  },
  input: { organizationId: string; meetingId: string },
): Promise<WritePipedriveBlocksResult> {
  const features = await deps.organizationFeatures.listEnabledFeatures(
    input.organizationId,
  );
  if (!hasOrganizationFeature(features, "pipedrive_blocks")) {
    return { kind: "not_enabled" };
  }

  const meeting = await deps.meetings.findMeetingDetailWithAnalyses({
    id: input.meetingId,
    organizationId: input.organizationId,
  });
  if (!meeting) return { kind: "not_found" };
  if (meeting.status !== "READY") return { kind: "not_ready" };
  if (!getEnv().AI_GATEWAY_API_KEY) {
    return { kind: "unavailable", reason: "AI_NOT_CONFIGURED" };
  }
  if (!meeting.transcript.trim()) {
    return { kind: "unavailable", reason: "NO_TRANSCRIPT" };
  }

  const pick = (kind: string) =>
    meeting.analyses.find((a) => a.kind === kind)?.result ?? null;
  const salesScore = salesScoreForMeeting({
    scorecardResult: pick("SCORECARD"),
  });
  const kiss = kissResultSchema.safeParse(pick("KISS"));
  const challenge = kiss.success
    ? (challengesForDisplay({
        challenges: kiss.data.challenges ?? null,
        goldenQuestion: kiss.data.goldenQuestion,
        challenge: kiss.data.challenge ?? null,
        start: kiss.data.start,
      })[0]?.title ?? null)
    : null;

  try {
    const [model, history] = await Promise.all([
      resolvePromptGatewayModel(deps.prompts, "MEETING_DETAIL_SYNTHESIS"),
      loadContactHistory(deps, {
        organizationId: input.organizationId,
        meeting,
      }),
    ]);
    const extractionInput = {
      systemPrompt: PIPEDRIVE_BLOCKS_SYSTEM_PROMPT,
      model,
      contextJson: JSON.stringify(
        {
          prospect: meeting.prospectName,
          entreprise: meeting.prospectCompany,
          dateRdv: toAppTimeZoneDatetimeLocal(meeting.meetingAt),
          typeRdv: meeting.meetingType,
          rangRdv: `R${history.rank}`,
        },
        null,
        2,
      ),
      transcript: meeting.transcript.slice(0, TRANSCRIPT_MAX_CHARS),
      notes: meeting.notes,
      previousReport: history.previousReport,
    };
    const { value } = await reuseAnalysisOutput(deps, {
      organizationId: input.organizationId,
      kind: "PIPEDRIVE_BLOCKS",
      model,
      systemPrompt: PIPEDRIVE_BLOCKS_SYSTEM_PROMPT,
      userPrompt: JSON.stringify({ ...extractionInput, systemPrompt: null }),
      compute: () => deps.analysis.extractPipedriveBlocks(extractionInput),
    });
    const parsed = pipedriveExtractionSchema.safeParse(value);
    if (!parsed.success) return { kind: "failed" };

    const words = evidenceWords(meeting.transcript);
    const extraction = withVerifiedQuotes(parsed.data, (excerpt) =>
      isExcerptInSource(excerpt, words),
    );
    return {
      kind: "blocks",
      blocks: composePipedriveBlocks(extraction, {
        company: meeting.prospectCompany,
        prospectName: meeting.prospectName,
        meetingAt: meeting.meetingAt,
        meetingRank: history.rank,
        salesScore,
        medalName: tierFromSalesScore(salesScore)?.nom ?? null,
        challenge,
      }),
    };
  } catch {
    return { kind: "failed" };
  }
}
