import { VALEUR_NON_CALCULABLE } from "@/lib/valeur-non-calculable";

const euroFormat = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/**
 * Écrit un potentiel en euros, ou « n. c. » quand il n'est pas renseigné.
 *
 * Un tiret seul dans une colonne de montants se lit comme un zéro, ou comme un
 * signe moins tronqué : il faut dire que la donnée manque, pas la maquiller.
 *
 * Deux écrans écrivaient ce même montant chacun de leur côté, et les deux
 * copies avaient déjà divergé sur ce point précis : l'une disait « n. c. »,
 * l'autre dessinait un tiret. Le même montant absent se lisait donc de deux
 * façons selon l'écran, ce qu'une fonction unique rend impossible.
 */
export function formatPotentialEuro(amount: number | null): string {
  if (amount == null) return VALEUR_NON_CALCULABLE;
  return euroFormat.format(amount);
}
