import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";

/**
 * L'échelle sur laquelle une note de commercial s'écrit à l'écran.
 *
 * « sur5 » est celle du manager, qui classe son équipe avec. « sur100 » est
 * celle du commercial : la revue du 2 septembre lui a retiré la note sur 5 et
 * rendu son SalesScore, celui qu'il lit sur chacun de ses rendez-vous. Le
 * rang, le palier et l'écart à la moyenne gardent le même calcul d'un côté et
 * de l'autre ; seule l'écriture change, et chaque écran dit laquelle il veut.
 */
export type EchelleDeNote = "sur5" | "sur100";

/**
 * Écrit un SalesScore moyen : « 68 sur 100 ».
 *
 * Sans score, la case porte « n. c. » et non un tiret, qui ne dirait pas si
 * c'est zéro ou une absence de donnée. Même règle que la note sur 5.
 */
export function formatScoreSur100(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return VALEUR_NON_CALCULABLE;
  return `${Math.round(value)} sur 100`;
}

/**
 * Écrit un écart entier signé : « +8 » · « −3 » · « 0 ».
 *
 * Le signe négatif est le vrai signe moins (U+2212), comme sur l'écart sur 5 :
 * le trait d'union est plus court et se confond avec une césure.
 */
export function formatEcartSur100(value: number): string {
  const arrondi = Math.round(value);
  if (arrondi === 0) return "0";
  return `${arrondi < 0 ? "−" : "+"}${Math.abs(arrondi)}`;
}
