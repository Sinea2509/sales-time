import type { StatsWindowDays } from "./dashboard-stats-window";

/** RDV « connecté » : durée de conversation renseignée (> 0 min). */
export function isConnectedMeetingDuration(
  durationMin: number | null | undefined,
): durationMin is number {
  return durationMin != null && durationMin > 0;
}

/** TAM — temps d'appel moyen (minutes) sur les RDV connectés uniquement. */
export function averageTamMinutes(
  durationsMin: Array<number | null | undefined>,
): number | null {
  const connected = durationsMin.filter(isConnectedMeetingDuration);
  if (connected.length === 0) return null;
  const sum = connected.reduce((acc, d) => acc + d, 0);
  return Math.round(sum / connected.length);
}

/** Somme du temps de conversation utile (durées des RDV connectés). */
export function sumUsefulConversationMinutes(
  durationsMin: Array<number | null | undefined>,
): number {
  return durationsMin.reduce<number>(
    (acc, d) => acc + (isConnectedMeetingDuration(d) ? d : 0),
    0,
  );
}

/** Nombre de RDV avec durée renseignée (> 0 min). */
export function countConnectedMeetings(
  durationsMin: Array<number | null | undefined>,
): number {
  return durationsMin.filter(isConnectedMeetingDuration).length;
}

/** Temps total de prospection sur la fenêtre (objectif mensuel proratisé). */
export function prospectingMinutesForStatsWindow(
  tamObjectiveMinutesPerMonth: number,
  statsWindowDays: StatsWindowDays,
): number {
  if (tamObjectiveMinutesPerMonth <= 0) return 0;
  return Math.round((tamObjectiveMinutesPerMonth * statsWindowDays) / 30);
}

/**
 * TUC optimisé = temps de conversation utile / temps total de prospection (0–100 %).
 */
export function tucOptimisePercent(
  usefulConversationMinutes: number,
  totalProspectingMinutes: number,
): number | null {
  if (totalProspectingMinutes <= 0) return null;
  const pct = (100 * usefulConversationMinutes) / totalProspectingMinutes;
  return Math.min(100, Math.round(pct * 10) / 10);
}
