import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";
import { formatNoteFr } from "@/src/core/domain/team-ranking";

/**
 * Écrit une note globale sur 5 : « 4/5 », « 3,5/5 ».
 *
 * L'arrondi au dixième est appliqué ici aussi, pas seulement en amont : une note
 * affichée doit toujours être un nombre que le lecteur peut réutiliser dans un
 * calcul mental, jamais « 3,4666667/5 ». Sans note, la case porte « n. c. » et non
 * un tiret, qui ne dirait pas si c'est zéro ou une absence de donnée.
 */
export function formatNoteOn5(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return VALEUR_NON_CALCULABLE;
  return `${formatNoteFr(value)}/5`;
}
