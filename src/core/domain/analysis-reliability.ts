/**
 * Ce que la longueur du transcript permet d'attendre de l'analyse.
 *
 * Un modèle note ce qu'il lit : sur cent mots il invente le reste, sur deux
 * mille il a de quoi citer. La fiche le dit avant que le commercial ne
 * s'étonne d'un score.
 */
export type AnalysisReliability = {
  level: "insuffisante" | "faible" | "correcte" | "bonne";
  tone: "bad" | "warn" | "info" | "ok";
  text: string;
};

/** En dessous, l'analyse ne devrait pas démarrer. */
export const ANALYSIS_MIN_WORDS = 250;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function analysisReliabilityFromWords(
  words: number,
): AnalysisReliability {
  if (words < ANALYSIS_MIN_WORDS) {
    return {
      level: "insuffisante",
      tone: "bad",
      text: "trop court pour être analysé",
    };
  }
  if (words < 800) {
    return {
      level: "faible",
      tone: "warn",
      text: "transcript court, lecture prudente",
    };
  }
  if (words < 2000) {
    return {
      level: "correcte",
      tone: "info",
      text: "transcript d'une longueur normale",
    };
  }
  return { level: "bonne", tone: "ok", text: "transcript long et détaillé" };
}
