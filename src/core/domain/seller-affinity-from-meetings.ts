import {
  discResultSchema,
  soncasResultSchema,
} from "@/src/core/domain/analysis-result-zod";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";
import { normalizeScoresToHundred } from "@/src/core/domain/normalize-scores-to-hundred";

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

/** Vocabulaire DISC affiché. Exporté : le reste du produit doit éviter ces mots. */
export const DISC_LABEL_FR: Record<(typeof DISC_KEYS)[number], string> = {
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

/** Vocabulaire SONCAS affiché. Exporté : le reste du produit doit éviter ces mots. */
export const SONCAS_LABEL_FR: Record<(typeof SONCAS_KEYS)[number], string> = {
  securite: "Sécurité",
  orgueil: "Orgueil",
  nouveaute: "Nouveauté",
  confort: "Confort",
  argent: "Argent",
  sympathie: "Sympathie",
};

/*
  Une seule couleur par profil, écrite ici et nulle part ailleurs : les barres
  des fiches, leurs pastilles et les camemberts du tableau de bord manager
  lisent ces tables. Avant, « Influent » était ambre sur la fiche et bleu sur
  le camembert, « Sécurité » cyan ici et indigo là-bas : le même profil
  changeait de couleur en changeant de page.

  Les deux jeux sont passés au validateur de palettes du kit de visualisation
  (OKLab, vision normale et les trois daltonismes, toutes paires) sur fond
  clair, seul thème optimisé. DISC passe tout. SONCAS passe avec deux réserves
  que l'écran honore déjà : la paire rose et émeraude tombe dans la bande 6 à
  8 de séparation daltonienne, licite seulement avec un étiquetage direct, et
  l'ambre comme le cyan tiennent moins de 3:1 sur blanc. Chaque barre et
  chaque part de camembert porte donc son libellé et son pourcentage en
  toutes lettres, jamais la couleur seule.

  Le violet n'y figure pas : il signe la marque, les actions et la
  navigation. « Orgueil », qui portait violet-600, passe en fuchsia.
*/

/** Couleur hex par profil DISC, pour les tracés qui ne lisent pas de classe. */
export const DISC_HEX: Record<(typeof DISC_KEYS)[number], string> = {
  D: "#dc2626",
  I: "#f59e0b",
  S: "#059669",
  C: "#2563eb",
};

/** Remplissage barre DISC : dominant rouge, influent ambre, stable vert, conforme bleu. */
export const DISC_BAR_CLASS: Record<(typeof DISC_KEYS)[number], string> = {
  D: "bg-red-600",
  I: "bg-amber-500",
  S: "bg-emerald-600",
  C: "bg-blue-600",
};

/** Couleur hex par levier SONCAS, la même que la barre du levier. */
export const SONCAS_HEX: Record<(typeof SONCAS_KEYS)[number], string> = {
  securite: "#1d4ed8",
  orgueil: "#d946ef",
  nouveaute: "#047857",
  confort: "#06b6d4",
  argent: "#f59e0b",
  sympathie: "#e11d48",
};

/** Remplissage barre SONCAS : couleurs distinctes par levier. */
export const SONCAS_BAR_CLASS: Record<(typeof SONCAS_KEYS)[number], string> = {
  securite: "bg-blue-700",
  orgueil: "bg-fuchsia-500",
  nouveaute: "bg-emerald-700",
  confort: "bg-cyan-500",
  argent: "bg-amber-500",
  sympathie: "bg-rose-600",
};

/** Pastille tag : même palette que les barres DISC. */
export const DISC_PILL_CLASS: Record<(typeof DISC_KEYS)[number], string> = {
  D: "border-red-600/30 bg-red-600/10 text-red-800 dark:text-red-200",
  I: "border-amber-500/35 bg-amber-500/15 text-amber-900 dark:text-amber-100",
  S: "border-emerald-600/30 bg-emerald-600/10 text-emerald-800 dark:text-emerald-200",
  C: "border-blue-600/30 bg-blue-600/10 text-blue-800 dark:text-blue-200",
};

/** Pastille tag : même palette que les barres SONCAS. */
export const SONCAS_PILL_CLASS: Record<(typeof SONCAS_KEYS)[number], string> = {
  securite:
    "border-blue-700/30 bg-blue-700/10 text-blue-800 dark:text-blue-200",
  orgueil:
    "border-fuchsia-500/35 bg-fuchsia-500/10 text-fuchsia-800 dark:text-fuchsia-200",
  nouveaute:
    "border-emerald-700/30 bg-emerald-700/10 text-emerald-800 dark:text-emerald-200",
  confort: "border-cyan-500/35 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200",
  argent:
    "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  sympathie:
    "border-rose-600/30 bg-rose-600/10 text-rose-800 dark:text-rose-200",
};

function clampPct(n: number): number {
  /* istanbul ignore if -- averages are finite for Zod-valid scores */
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Nombre de RDV avec analyse DISC valide sur la période. */
export function countDiscAnalyzedMeetings(
  meetings: RecentMeetingListRow[],
): number {
  let n = 0;
  for (const m of meetings) {
    if (discResultSchema.safeParse(m.latestDiscResult).success) n += 1;
  }
  return n;
}

/** Nombre de RDV avec analyse SONCAS valide sur la période. */
export function countSoncasAnalyzedMeetings(
  meetings: RecentMeetingListRow[],
): number {
  let n = 0;
  for (const m of meetings) {
    if (soncasResultSchema.safeParse(m.latestSoncasResult).success) n += 1;
  }
  return n;
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
  const averages = Object.fromEntries(
    DISC_KEYS.map((key) => [key, sum[key] / n]),
  );
  const normalized = normalizeScoresToHundred(averages);
  const items: DiscBarDatum[] = DISC_KEYS.map((key) => ({
    key,
    label: DISC_LABEL_FR[key],
    pct: clampPct(normalized[key] ?? 0),
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
  const averages = Object.fromEntries(
    SONCAS_KEYS.map((key) => [key, sum[key] / n]),
  );
  const normalized = normalizeScoresToHundred(averages);
  const items: SoncasBarDatum[] = SONCAS_KEYS.map((key) => ({
    key,
    label: SONCAS_LABEL_FR[key],
    pct: clampPct(normalized[key] ?? 0),
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
