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
  le camembert : le même profil changeait de couleur en changeant de page.

  Depuis l'audit du tableau de bord du 21 octobre 2026, les profils prennent
  la palette de la charte (celle des visuels 3D) au lieu des couleurs
  primaires saturées : DISC garde ses quatre teintes conventionnelles,
  accordées à la palette (D corail, I ambre, S turquoise, C violet) ; SONCAS
  prend les quatre mêmes, plus un violet clair et un gris violet. Le violet
  de la marque entre donc dans les données, à la demande de l'audit.

  Ambre et turquoise tiennent moins de 3:1 sur blanc : chaque barre et chaque
  part de camembert porte son libellé et son pourcentage en toutes lettres,
  jamais la couleur seule.
*/

/** Couleur hex par profil DISC, pour les tracés qui ne lisent pas de classe. */
export const DISC_HEX: Record<(typeof DISC_KEYS)[number], string> = {
  D: "#FF7A6B",
  I: "#FFB547",
  S: "#33D1B5",
  C: "#6C4DFF",
};

/** Remplissage barre DISC : la même couleur que le camembert. */
export const DISC_BAR_CLASS: Record<(typeof DISC_KEYS)[number], string> = {
  D: "bg-[#FF7A6B]",
  I: "bg-[#FFB547]",
  S: "bg-[#33D1B5]",
  C: "bg-[#6C4DFF]",
};

/** Couleur hex par levier SONCAS, la même que la barre du levier. */
export const SONCAS_HEX: Record<(typeof SONCAS_KEYS)[number], string> = {
  securite: "#6C4DFF",
  orgueil: "#FF7A6B",
  nouveaute: "#FFB547",
  confort: "#33D1B5",
  argent: "#A08CFF",
  sympathie: "#8C88A8",
};

/** Remplissage barre SONCAS : la même couleur que le camembert. */
export const SONCAS_BAR_CLASS: Record<(typeof SONCAS_KEYS)[number], string> = {
  securite: "bg-[#6C4DFF]",
  orgueil: "bg-[#FF7A6B]",
  nouveaute: "bg-[#FFB547]",
  confort: "bg-[#33D1B5]",
  argent: "bg-[#A08CFF]",
  sympathie: "bg-[#8C88A8]",
};

/*
  Les pastilles : un fond pâle de la couleur du profil, et un texte de la
  même teinte assombri, lisible sur ce fond.
*/
const PILL = {
  coral:
    "border-[#FF7A6B]/40 bg-[#FF7A6B]/12 text-[#A93A2C] dark:text-[#FFB3A9]",
  amber:
    "border-[#FFB547]/45 bg-[#FFB547]/15 text-[#8A5600] dark:text-[#FFD9A0]",
  teal: "border-[#33D1B5]/45 bg-[#33D1B5]/15 text-[#0B6E5C] dark:text-[#9EEEDF]",
  violet:
    "border-[#6C4DFF]/35 bg-[#6C4DFF]/10 text-[#4527D6] dark:text-[#C9BDFF]",
  lavender:
    "border-[#A08CFF]/45 bg-[#A08CFF]/15 text-[#5240B8] dark:text-[#D9D0FF]",
  greyViolet:
    "border-[#8C88A8]/45 bg-[#8C88A8]/15 text-[#4A4762] dark:text-[#D2D0E0]",
} as const;

/** Pastille tag : même palette que les barres DISC. */
export const DISC_PILL_CLASS: Record<(typeof DISC_KEYS)[number], string> = {
  D: PILL.coral,
  I: PILL.amber,
  S: PILL.teal,
  C: PILL.violet,
};

/** Pastille tag : même palette que les barres SONCAS. */
export const SONCAS_PILL_CLASS: Record<(typeof SONCAS_KEYS)[number], string> = {
  securite: PILL.violet,
  orgueil: PILL.coral,
  nouveaute: PILL.amber,
  confort: PILL.teal,
  argent: PILL.lavender,
  sympathie: PILL.greyViolet,
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
