import type {
  DiscAnalysisResult,
  SoncasAnalysisResult,
} from "@/src/core/domain/analysis-result-zod";
import {
  DISC_BAR_CLASS,
  DISC_PILL_CLASS,
  SONCAS_BAR_CLASS,
  SONCAS_PILL_CLASS,
  type DiscBarDatum,
  type SoncasBarDatum,
} from "@/src/core/domain/seller-affinity-from-meetings";
/*
  Les barres de la fiche montrent le score de chaque levier et de chaque style,
  sur 100, tel que l'analyse l'a noté (lot 77). Elles montraient jusqu'ici la
  part de chacun dans le total, ramené à 100 : un levier noté 70 s'affichait
  « 23 % », et le lecteur ne pouvait plus le comparer à l'échelle de preuves
  ni à la note citée dans les textes.
*/

const DISC_KEYS = ["D", "I", "S", "C"] as const;

/** Les noms des styles, ceux de la méthode, comme dans la maquette validée. */
const DISC_LABEL_FR: Record<(typeof DISC_KEYS)[number], string> = {
  D: "Dominance",
  I: "Influence",
  S: "Stabilité",
  C: "Conformité",
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

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function discBarsFromResult(result: DiscAnalysisResult): DiscBarDatum[] {
  const items: DiscBarDatum[] = DISC_KEYS.map((key) => ({
    key,
    label: DISC_LABEL_FR[key],
    pct: clampPct(result.scores[key] ?? 0),
  }));
  items.sort((a, b) => b.pct - a.pct || a.key.localeCompare(b.key));
  return items;
}

export function soncasBarsFromResult(
  result: SoncasAnalysisResult,
): SoncasBarDatum[] {
  const items: SoncasBarDatum[] = SONCAS_KEYS.map((key) => ({
    key,
    label: SONCAS_LABEL_FR[key],
    pct: clampPct(result.drivers[key].score),
  }));
  items.sort((a, b) => b.pct - a.pct || a.key.localeCompare(b.key));
  return items;
}

export function discBarItemsForUi(result: DiscAnalysisResult) {
  return discBarsFromResult(result).map((row) => ({
    ...row,
    barClass: DISC_BAR_CLASS[row.key],
    pillClass: DISC_PILL_CLASS[row.key],
  }));
}

export function soncasBarItemsForUi(result: SoncasAnalysisResult) {
  return soncasBarsFromResult(result).map((row) => ({
    ...row,
    barClass: SONCAS_BAR_CLASS[row.key],
    pillClass: SONCAS_PILL_CLASS[row.key],
  }));
}

/**
 * Le levier principal annoncé par l'analyse.
 *
 * Pris dans le résultat, et non en tête des barres : c'est celui que le
 * modèle a nommé, et dont parlent son résumé et ses conseils. Une limite
 * connue : quand la règle de preuve baisse la note de ce levier faute de
 * citation retrouvée, elle désigne un autre levier principal, alors que le
 * résumé et les conseils, écrits par le modèle, parlent encore du premier.
 */
export function soncasPrincipalForUi(result: SoncasAnalysisResult) {
  return {
    label: SONCAS_LABEL_FR[result.dominant],
    pillClass: SONCAS_PILL_CLASS[result.dominant],
  };
}

/** Le style principal annoncé par l'analyse, celui dont parlent ses textes. */
export function discPrincipalForUi(result: DiscAnalysisResult) {
  return {
    label: DISC_LABEL_FR[result.dominant],
    pillClass: DISC_PILL_CLASS[result.dominant],
  };
}
