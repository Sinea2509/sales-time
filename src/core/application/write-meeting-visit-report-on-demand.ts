import { getEnv } from "@/lib/env";
import {
  discResultSchema,
  soncasResultSchema,
} from "@/src/core/domain/analysis-result-zod";
import { kissResultSchema } from "@/src/core/domain/kiss-result-zod";
import { scorecardResultSchema } from "@/src/core/domain/scorecard-result-zod";
import {
  isCurrentVisitReport,
  visitReportWithoutSellerCoaching,
} from "@/src/core/domain/visit-report";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";
import type { OrganizationPromptRepositoryPort } from "@/src/core/ports/organization-prompt-repository-port";
import type { OrganizationSettingsRepositoryPort } from "@/src/core/ports/organization-settings-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";
import type { UserRepositoryPort } from "@/src/core/ports/user-repository-port";
import { summarizeMeetingDetail } from "./summarize-meeting-detail";

export type WriteMeetingVisitReportResult =
  | { kind: "text"; text: string }
  | { kind: "not_found" }
  | { kind: "not_ready" }
  | { kind: "failed" }
  | { kind: "unavailable"; reason: "AI_NOT_CONFIGURED" | "NO_TRANSCRIPT" };

/**
 * Le compte rendu de visite, rendu tel qu'il est enregistré, ou écrit à la
 * demande la première fois qu'on ouvre la fiche d'un rendez-vous analysé.
 *
 * L'écrire à l'ouverture plutôt qu'à la fin de l'analyse rend le rendez-vous
 * « prêt » une étape plus tôt, et la fiche s'ouvre sans attendre le modèle :
 * elle affiche un état d'attente, puis le compte rendu d'un bloc. Deux
 * lecteurs pendant l'écriture déclenchent deux écritures ; le texte enregistré
 * est le même, composé à partir des mêmes analyses.
 *
 * La grille et le coaching ne se lisent que par le commercial assigné et les
 * managers : pour les autres membres, ces rubriques sont retirées du texte
 * rendu, comme sur la fiche.
 */
export async function writeMeetingVisitReportOnDemand(
  deps: {
    analysis: AnalysisPort;
    prompts: PromptTemplateRepositoryPort;
    organizationPrompts: OrganizationPromptRepositoryPort;
    meetings: MeetingRepositoryPort;
    users?: Pick<UserRepositoryPort, "findAccountProfileByUserId">;
    organizationSettings?: Pick<
      OrganizationSettingsRepositoryPort,
      "findByOrganizationId"
    >;
  },
  input: {
    organizationId: string;
    meetingId: string;
    actor: { internalUserId: string | null; canManageOrganization: boolean };
  },
): Promise<WriteMeetingVisitReportResult> {
  const meeting = await deps.meetings.findMeetingDetailWithAnalyses({
    id: input.meetingId,
    organizationId: input.organizationId,
  });
  if (!meeting) return { kind: "not_found" };

  const canViewSellerCoaching =
    input.actor.canManageOrganization ||
    (input.actor.internalUserId != null &&
      meeting.sellerUserId === input.actor.internalUserId);
  const forReader = (text: string) =>
    canViewSellerCoaching ? text : visitReportWithoutSellerCoaching(text);

  /*
    Un compte rendu d'avant le lot 80a (quelques lignes de synthèse) vaut
    « manquant » : il se réécrit ici, dans la forme complète.
  */
  const stored = meeting.visitReportDraft?.trim();
  if (stored && isCurrentVisitReport(stored)) {
    return { kind: "text", text: forReader(stored) };
  }

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
  const scorecard = scorecardResultSchema.safeParse(pick("SCORECARD"));

  const synthesis = await summarizeMeetingDetail(deps, {
    meeting,
    discResult: disc.success ? disc.data : null,
    soncasResult: soncas.success ? soncas.data : null,
    kissResult: kiss.success ? kiss.data : null,
    scorecardResult: scorecard.success ? scorecard.data : null,
    organizationId: input.organizationId,
  });
  if (!synthesis.fromAi) return { kind: "failed" };
  return { kind: "text", text: forReader(synthesis.meetingSynthesis) };
}
