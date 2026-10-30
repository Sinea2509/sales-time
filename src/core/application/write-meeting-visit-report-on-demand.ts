import { getEnv } from "@/lib/env";
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
import {
  summarizeMeetingDetail,
  visitReportAnalyses,
} from "./summarize-meeting-detail";

export type WriteMeetingVisitReportResult =
  | { kind: "text"; text: string }
  | { kind: "not_found" }
  | { kind: "not_ready" }
  | { kind: "failed" }
  | { kind: "unavailable"; reason: "AI_NOT_CONFIGURED" | "NO_TRANSCRIPT" };

/**
 * Le compte rendu de visite, rendu tel qu'il est enregistré, ou écrit à la
 * demande quand il manque : il se compose à la fin de l'analyse depuis le
 * 30 octobre 2026, et ce chemin sert aux rendez-vous d'avant, aux modifiés, et
 * aux cas où l'extraction a échoué pendant l'analyse.
 *
 * La fiche s'ouvre sans attendre le modèle : elle affiche un état d'attente,
 * puis le compte rendu d'un bloc. Deux lecteurs pendant l'écriture déclenchent
 * deux écritures ; le texte enregistré est le même, composé à partir des mêmes
 * analyses.
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

  const synthesis = await summarizeMeetingDetail(deps, {
    meeting,
    ...visitReportAnalyses(meeting),
    organizationId: input.organizationId,
  });
  if (!synthesis.fromAi) return { kind: "failed" };
  return { kind: "text", text: forReader(synthesis.meetingSynthesis) };
}
