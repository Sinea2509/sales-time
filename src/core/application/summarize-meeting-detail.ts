import { getEnv } from "@/lib/env";
import { loadAnalysisPromptMarkdown } from "@/lib/load-analysis-prompt";
import { resolvePromptGatewayModel } from "@/lib/load-analysis-model";
import type {
  DiscAnalysisResult,
  SoncasAnalysisResult,
} from "@/src/core/domain/analysis-result-zod";
import type { KissAnalysisResult } from "@/src/core/domain/kiss-result-zod";
import type { MeetingStatus } from "@/src/core/domain/meeting-status";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { MeetingDetailWithAnalyses } from "@/src/core/ports/meeting-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";

export type MeetingDetailSynthesisContent = {
  meetingSynthesis: string;
  interlocutorProfile: string;
  fromAi: boolean;
};

const PROCESSING_REPORT_MESSAGE =
  "Compte-rendu en cours de génération — disponible à la fin de l'analyse automatique.";

const PENDING_REPORT_MESSAGE =
  "L'analyse automatique (SONCAS, DISC, KISS) démarrera dès que le rendez-vous sera enregistré.";

function interlocutorProfileFromAnalyses(input: {
  discResult: DiscAnalysisResult | null;
  soncasResult: SoncasAnalysisResult | null;
}): string {
  const profileParts = [
    input.discResult?.summary?.trim(),
    input.soncasResult?.summary?.trim(),
  ].filter((s): s is string => Boolean(s));
  return profileParts.length > 0
    ? profileParts.join(" ")
    : "Profil interlocuteur disponible après l'analyse automatique.";
}

function fallbackSynthesis(input: {
  status: MeetingStatus;
  kissResult: KissAnalysisResult | null;
  discResult: DiscAnalysisResult | null;
  soncasResult: SoncasAnalysisResult | null;
}): MeetingDetailSynthesisContent {
  const meetingSynthesis =
    input.status === "PROCESSING"
      ? PROCESSING_REPORT_MESSAGE
      : input.kissResult?.summary?.trim() || PENDING_REPORT_MESSAGE;

  return {
    meetingSynthesis,
    interlocutorProfile: interlocutorProfileFromAnalyses(input),
    fromAi: false,
  };
}

export async function summarizeMeetingDetail(
  deps: {
    analysis: AnalysisPort;
    prompts: PromptTemplateRepositoryPort;
  },
  input: {
    meeting: MeetingDetailWithAnalyses;
    discResult: DiscAnalysisResult | null;
    soncasResult: SoncasAnalysisResult | null;
    kissResult: KissAnalysisResult | null;
    /** Bypass READY guard (analysis worker after SONCAS/DISC/KISS). */
    forceAiGeneration?: boolean;
  },
): Promise<MeetingDetailSynthesisContent> {
  const storedReport = input.meeting.visitReportDraft?.trim();
  if (storedReport) {
    return {
      meetingSynthesis: storedReport,
      interlocutorProfile: interlocutorProfileFromAnalyses(input),
      fromAi: true,
    };
  }

  const fallback = fallbackSynthesis({
    status: input.meeting.status,
    ...input,
  });

  const canGenerateAi =
    input.forceAiGeneration === true || input.meeting.status === "READY";

  if (
    !canGenerateAi ||
    !getEnv().AI_GATEWAY_API_KEY ||
    !input.meeting.transcript.trim()
  ) {
    return fallback;
  }

  try {
    const [systemMarkdown, model] = await Promise.all([
      loadAnalysisPromptMarkdown(deps.prompts, "MEETING_DETAIL_SYNTHESIS"),
      resolvePromptGatewayModel(deps.prompts, "MEETING_DETAIL_SYNTHESIS"),
    ]);
    const result = await deps.analysis.summarizeMeetingDetail({
      systemMarkdown,
      model,
      prospectName: input.meeting.prospectName,
      prospectCompany: input.meeting.prospectCompany,
      meetingAt: input.meeting.meetingAt.toISOString(),
      outcome: input.meeting.outcome,
      meetingType: input.meeting.meetingType,
      pipelineStage: input.meeting.pipelineStage,
      transcriptExcerpt: input.meeting.transcript.slice(0, 8_000),
      discResult: input.discResult,
      soncasResult: input.soncasResult,
      kissResult: input.kissResult,
    });
    return {
      meetingSynthesis: result.meetingSynthesis.trim(),
      interlocutorProfile: result.interlocutorProfile.trim(),
      fromAi: true,
    };
  } catch {
    return fallback;
  }
}

/** Generates and persists the CRM visit report after SONCAS/DISC/KISS analyses. */
export async function generateAndPersistMeetingVisitReport(
  deps: {
    analysis: AnalysisPort;
    prompts: PromptTemplateRepositoryPort;
    meetings: import("@/src/core/ports/meeting-repository-port").MeetingRepositoryPort;
  },
  input: {
    organizationId: string;
    meeting: MeetingDetailWithAnalyses;
    discResult: DiscAnalysisResult | null;
    soncasResult: SoncasAnalysisResult | null;
    kissResult: KissAnalysisResult | null;
  },
): Promise<void> {
  const synthesis = await summarizeMeetingDetail(deps, {
    ...input,
    forceAiGeneration: true,
  });
  if (!synthesis.fromAi || !synthesis.meetingSynthesis.trim()) {
    return;
  }
  await deps.meetings.updateMeetingVisitReportDraft({
    id: input.meeting.id,
    organizationId: input.organizationId,
    visitReportDraft: synthesis.meetingSynthesis.trim(),
  });
}
