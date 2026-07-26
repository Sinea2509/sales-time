import { DEFAULT_STATS_WINDOW_DAYS } from "@/src/core/domain/dashboard-stats-window";

/**
 * Les adresses que la page « Mon équipe » écrit vers elle-même et vers ses
 * fiches.
 *
 * Elles vivent ici plutôt que dans le composant parce que la fiche s'appuie sur
 * elles pour son lien de retour : ce qu'un lien emporte, l'autre doit savoir le
 * relire. Deux règles écrites à deux endroits finissaient par diverger sans que
 * rien ne casse, et le manager retombait page 1 sans qu'aucun écran ne le lui
 * ait annoncé.
 */

/** La liste elle-même, à une page donnée. */
export function monEquipeListHref(
  basePath: string,
  jours: number,
  equipePage: number,
): string {
  const q = new URLSearchParams();
  q.set("jours", String(jours));
  if (equipePage > 1) {
    q.set("equipePage", String(equipePage));
  }
  return `${basePath}?${q.toString()}`;
}

/**
 * La fiche d'un membre, avec de quoi en revenir.
 *
 * La page de liste voyage avec le lien parce que la fiche s'en sert pour son
 * lien de retour : sans elle, ouvrir une fiche depuis la page 3 puis revenir
 * ramenait le manager à la page 1.
 *
 * Ni la période par défaut ni la première page ne s'écrivent : elles se disent
 * par leur absence, et la fiche redirige de toute façon la première des deux
 * vers son adresse nue.
 */
export function ficheMembreHref(
  userId: string,
  jours: number,
  equipePage: number,
): string {
  const q = new URLSearchParams();
  if (jours !== DEFAULT_STATS_WINDOW_DAYS) q.set("jours", String(jours));
  if (equipePage > 1) q.set("equipePage", String(equipePage));
  const query = q.toString();
  return `/company/equipe/${userId}${query === "" ? "" : `?${query}`}`;
}
