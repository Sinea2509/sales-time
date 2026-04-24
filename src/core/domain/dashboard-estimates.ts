import type { OrganizationSettingsRow } from "@/src/core/ports/organization-settings-repository-port";

/**
 * Estimation du TAM cumulé (€) = nombre cumulé de RDV × ce montant.
 * Affichage simplifié ; le modèle temps (minutes) est préféré via
 * `tamMinutesSavedPerMeetingFromSettings`.
 */
export const ESTIMATED_TAM_EUR_PER_RDV = 25_000;

/** Temps utile récupéré (minutes) par RDV entièrement traité avec l’outil — d’après paramètres org. */
export function tamMinutesSavedPerMeetingFromSettings(
  settings: Pick<
    OrganizationSettingsRow,
    | "tamCrMinutes"
    | "tamCrmMinutes"
    | "tamEmailMinutes"
    | "tamResidualMinutes"
  > | null,
): number {
  const cr = settings?.tamCrMinutes ?? 15;
  const crm = settings?.tamCrmMinutes ?? 10;
  const email = settings?.tamEmailMinutes ?? 8;
  const residual = settings?.tamResidualMinutes ?? 5;
  return Math.max(0, cr + crm + email - residual);
}
