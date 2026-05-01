import {
  discResultSchema,
  soncasResultSchema,
} from "@/src/core/domain/analysis-result-zod";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";

export type DiscBarDatum = {
  key: "D" | "I" | "S" | "C";
  label: string;
  pct: number;
};

export type SoncasBarDatum = {
  key:
    | "securite"
    | "orgueil"
    | "nouveaute"
    | "confort"
    | "argent"
    | "sympathie";
  label: string;
  pct: number;
};

const DISC_KEYS = ["D", "I", "S", "C"] as const;

const DISC_LABEL_FR: Record<(typeof DISC_KEYS)[number], string> = {
  D: "Dominant",
  I: "Influent",
  S: "Stable",
  C: "Conforme",
};

const SONCAS_KEYS = [
  "securite",
  "orgueil",
  "nouveaute",
  "confort",
  "argent",
  "sympathie",
] as const;

const SONCAS_LABEL_FR: Record<(typeof SONCAS_KEYS)[number], string> = {
  securite: "Sécurité",
  orgueil: "Orgueil",
  nouveaute: "Nouveauté",
  confort: "Confort",
  argent: "Argent",
  sympathie: "Sympathie",
};

/** Remplissage barre — DISC : dominant rouge, influent jaune, stable vert, conforme bleu. */
export const DISC_BAR_CLASS: Record<(typeof DISC_KEYS)[number], string> = {
  D: "bg-red-600",
  I: "bg-amber-400",
  S: "bg-emerald-600",
  C: "bg-blue-600",
};

/** Remplissage barre SONCAS — couleurs distinctes par levier. */
export const SONCAS_BAR_CLASS: Record<(typeof SONCAS_KEYS)[number], string> = {
  securite: "bg-cyan-600",
  orgueil: "bg-violet-600",
  nouveaute: "bg-amber-500",
  confort: "bg-teal-600",
  argent: "bg-orange-600",
  sympathie: "bg-rose-600",
};

function clampPct(n: number): number {
  /* istanbul ignore if -- averages are finite for Zod-valid scores */
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Moyenne des scores DISC prospect sur les RDV ayant une analyse DISC valide,
 * tri décroissant par %.
 */
export function aggregateDiscAffinityBarsFromMeetings(
  meetings: RecentMeetingListRow[],
): DiscBarDatum[] {
  const sum = { D: 0, I: 0, S: 0, C: 0 };
  let n = 0;
  for (const m of meetings) {
    const parsed = discResultSchema.safeParse(m.latestDiscResult);
    if (!parsed.success) continue;
    const s = parsed.data.scores;
    sum.D += s.D;
    sum.I += s.I;
    sum.S += s.S;
    sum.C += s.C;
    n += 1;
  }
  if (n === 0) return [];
  const items: DiscBarDatum[] = DISC_KEYS.map((key) => ({
    key,
    label: DISC_LABEL_FR[key],
    pct: clampPct(sum[key] / n),
  }));
  items.sort((a, b) => b.pct - a.pct || a.key.localeCompare(b.key));
  return items;
}

/**
 * Moyenne des scores SONCAS (drivers) sur les RDV ayant une analyse valide,
 * tri décroissant par %.
 */
export function aggregateSoncasAffinityBarsFromMeetings(
  meetings: RecentMeetingListRow[],
): SoncasBarDatum[] {
  const sum = {
    securite: 0,
    orgueil: 0,
    nouveaute: 0,
    confort: 0,
    argent: 0,
    sympathie: 0,
  };
  let n = 0;
  for (const m of meetings) {
    const parsed = soncasResultSchema.safeParse(m.latestSoncasResult);
    if (!parsed.success) continue;
    const d = parsed.data.drivers;
    sum.securite += d.securite.score;
    sum.orgueil += d.orgueil.score;
    sum.nouveaute += d.nouveaute.score;
    sum.confort += d.confort.score;
    sum.argent += d.argent.score;
    sum.sympathie += d.sympathie.score;
    n += 1;
  }
  if (n === 0) return [];
  const items: SoncasBarDatum[] = SONCAS_KEYS.map((key) => ({
    key,
    label: SONCAS_LABEL_FR[key],
    pct: clampPct(sum[key] / n),
  }));
  items.sort((a, b) => b.pct - a.pct || a.key.localeCompare(b.key));
  return items;
}

/** Grille DISC à 0 % (aucune analyse sur la période). */
export function emptyDiscAffinityPlaceholder(): DiscBarDatum[] {
  return DISC_KEYS.map((key) => ({
    key,
    label: DISC_LABEL_FR[key],
    pct: 0,
  }));
}

/** Grille SONCAS à 0 % (aucune analyse sur la période). */
export function emptySoncasAffinityPlaceholder(): SoncasBarDatum[] {
  return SONCAS_KEYS.map((key) => ({
    key,
    label: SONCAS_LABEL_FR[key],
    pct: 0,
  }));
}
