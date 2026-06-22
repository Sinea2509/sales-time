import { getEnv } from "@/lib/env";
import { loadAnalysisPromptMarkdown } from "@/lib/load-analysis-prompt";
import { resolvePromptGatewayModel } from "@/lib/load-analysis-model";
import type {
  DiscAnalysisResult,
  SoncasAnalysisResult,
} from "@/src/core/domain/analysis-result-zod";
import type { KissAnalysisResult } from "@/src/core/domain/kiss-result-zod";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { MeetingDetailWithAnalyses } from "@/src/core/ports/meeting-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";

export type MeetingDetailSynthesisContent = {
  meetingSynthesis: string;
  interlocutorProfile: string;
  fromAi: boolean;
};

function fallbackSynthesis(input: {
  kissResult: KissAnalysisResult | null;
  discResult: DiscAnalysisResult | null;
  soncasResult: SoncasAnalysisResult | null;
}): MeetingDetailSynthesisContent {
  const meetingSynthesis =
    input.kissResult?.summary?.trim() ||
    "L'analyse automatique (SONCAS, DISC, KISS) démarrera dès que le rendez-vous sera enregistré.";

  const profileParts = [
    input.discResult?.summary?.trim(),
    input.soncasResult?.summary?.trim(),
  ].filter((s): s is string => Boolean(s));
  const interlocutorProfile =
    profileParts.length > 0
      ? profileParts.join(" ")
      : "Profil interlocuteur disponible après l'analyse automatique.";

  return { meetingSynthesis, interlocutorProfile, fromAi: false };
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
  },
): Promise<MeetingDetailSynthesisContent> {
  const fallback = fallbackSynthesis(input);

  if (!getEnv().AI_GATEWAY_API_KEY || !input.meeting.transcript.trim()) {
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
