import type { OrganizationSettingsRow } from "@/src/core/ports/organization-settings-repository-port";

/** Temps utile récupéré (minutes) par RDV entièrement traité avec l’outil, d’après les paramètres de l’organisation. */
export function tamMinutesSavedPerMeetingFromSettings(
  settings: Pick<
    OrganizationSettingsRow,
    "tamCrMinutes" | "tamCrmMinutes" | "tamEmailMinutes" | "tamResidualMinutes"
  > | null,
): number {
  const cr = settings?.tamCrMinutes ?? 15;
  const crm = settings?.tamCrmMinutes ?? 10;
  const email = settings?.tamEmailMinutes ?? 8;
  const residual = settings?.tamResidualMinutes ?? 5;
  return Math.max(0, cr + crm + email - residual);
}
