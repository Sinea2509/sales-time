import { getEnv } from "@/lib/env";
import { loadAnalysisPromptMarkdown } from "@/lib/load-analysis-prompt";
import { resolvePromptGatewayModel } from "@/lib/load-analysis-model";
import {
  discResultSchema,
  soncasResultSchema,
} from "@/src/core/domain/analysis-result-zod";
import { kissResultSchema } from "@/src/core/domain/kiss-result-zod";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";

export type StreamMeetingVisitReportResult =
  | { kind: "stored"; text: string }
  | {
      kind: "stream";
      textStream: AsyncIterable<string>;
      /** Se résout une fois le texte complet enregistré sur le rendez-vous. */
      persisted: Promise<void>;
    }
  | { kind: "not_found" }
  | { kind: "not_ready" }
  | { kind: "unavailable"; reason: "AI_NOT_CONFIGURED" | "NO_TRANSCRIPT" };

/**
 * Le compte rendu de visite, rendu tel qu'il est enregistré, ou écrit au fil
 * de l'eau la première fois qu'on ouvre la fiche.
 *
 * L'écrire à la demande plutôt qu'à la fin de l'analyse rend le rendez-vous
 * « prêt » une étape plus tôt, et le commercial voit le texte se composer au
 * lieu d'attendre un paragraphe fini. Un deuxième lecteur pendant l'écriture
 * relance une écriture ; les deux enregistrent le même compte rendu.
 */
export async function streamMeetingVisitReport(
  deps: {
    meetings: MeetingRepositoryPort;
    prompts: PromptTemplateRepositoryPort;
    analysis: AnalysisPort;
  },
  input: { organizationId: string; meetingId: string },
): Promise<StreamMeetingVisitReportResult> {
  const meeting = await deps.meetings.findMeetingDetailWithAnalyses({
    id: input.meetingId,
    organizationId: input.organizationId,
  });
  if (!meeting) return { kind: "not_found" };

  const stored = meeting.visitReportDraft?.trim();
  if (stored) return { kind: "stored", text: stored };

  if (meeting.status !== "READY") return { kind: "not_ready" };
  if (!getEnv().AI_GATEWAY_API_KEY) {
    return { kind: "unavailable", reason: "AI_NOT_CONFIGURED" };
  }
  if (!meeting.transcript.trim()) {
    return { kind: "unavailable", reason: "NO_TRANSCRIPT" };
  }

  const pick = (kind: string) =>
    meeting.analyses.find((a) => a.kind === kind)?.result ?? null;
  const disc = discResultSchema.safeParse(pick("DISC"));
  const soncas = soncasResultSchema.safeParse(pick("SONCAS"));
  const kiss = kissResultSchema.safeParse(pick("KISS"));

  const [systemMarkdown, model] = await Promise.all([
    loadAnalysisPromptMarkdown(deps.prompts, "MEETING_DETAIL_SYNTHESIS"),
    resolvePromptGatewayModel(deps.prompts, "MEETING_DETAIL_SYNTHESIS"),
  ]);

  const { textStream, text } = await deps.analysis.streamMeetingVisitReport({
    systemMarkdown,
    model,
    prospectName: meeting.prospectName,
    prospectCompany: meeting.prospectCompany,
    meetingAt: meeting.meetingAt.toISOString(),
    outcome: meeting.outcome,
    meetingType: meeting.meetingType,
    pipelineStage: meeting.pipelineStage,
    transcriptExcerpt: meeting.transcript.slice(0, 8_000),
    discResult: disc.success ? disc.data : null,
    soncasResult: soncas.success ? soncas.data : null,
    kissResult: kiss.success ? kiss.data : null,
  });

  const persisted = Promise.resolve(text).then(async (full) => {
    const trimmed = full.trim();
    if (!trimmed) return;
    await deps.meetings.updateMeetingVisitReportDraft({
      id: meeting.id,
      organizationId: input.organizationId,
      visitReportDraft: trimmed,
    });
  });

  return { kind: "stream", textStream, persisted };
}
