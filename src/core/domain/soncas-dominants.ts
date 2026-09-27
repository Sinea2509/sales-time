import type { SoncasAnalysisResult } from "./analysis-result-zod";

export type SoncasKey = keyof SoncasAnalysisResult["drivers"];

/** L'ordre de l'acronyme, qui est aussi l'ordre d'affichage à égalité. */
export const SONCAS_KEYS: readonly SoncasKey[] = [
  "securite",
  "orgueil",
  "nouveaute",
  "confort",
  "argent",
  "sympathie",
];

/**
 * Les leviers en tête, tous ceux qui partagent la note la plus haute.
 *
 * Le modèle n'en nomme qu'un. Quand deux leviers sont à égalité, celui qu'il
 * a choisi n'a rien de plus que l'autre : l'annoncer seul comme « principal »
 * invente une hiérarchie que le rendez-vous n'a pas montrée. La fiche nomme
 * donc les deux, et le `dominant` du modèle reste en premier quand il est de
 * la partie, pour ne rien changer au cas ordinaire d'un seul levier en tête.
 */
export function soncasDominantKeys(result: SoncasAnalysisResult): SoncasKey[] {
  const max = Math.max(...SONCAS_KEYS.map((k) => result.drivers[k].score));
  const tied = SONCAS_KEYS.filter((k) => result.drivers[k].score === max);
  if (tied.length <= 1) return tied.length === 1 ? tied : [result.dominant];
  return tied.includes(result.dominant)
    ? [result.dominant, ...tied.filter((k) => k !== result.dominant)]
    : tied;
}

/** « Argent », « Sécurité et Argent », « Sécurité, Argent et Confort ». */
export function joinSoncasNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;
}
