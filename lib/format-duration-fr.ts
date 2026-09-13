/**
 * Une durée écrite en français, avec les espaces que la typographie demande.
 *
 * Le nombre et son unité sont séparés : « 32 min » et non « 32min », « 3 h 40 »
 * et non « 3h40 ». L'espace employée est insécable, pour que le nombre ne se
 * retrouve jamais en fin de ligne et son unité au début de la suivante. Le cas
 * se produit vraiment : la colonne TAM du tableau d'équipe est étroite, et la
 * valeur y tient sur une seule ligne ou sur deux selon la largeur de l'écran.
 *
 * Ex. 220 → « 3 h 40 », 60 → « 1 h », 32 → « 32 min ».
 */
export function formatDurationHoursMinutes(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  // `\u00a0` plutôt que le caractère lui-même : à l'écran il ne se distingue
  // pas d'une espace ordinaire, et une relecture ne pourrait pas les départager.
  if (h <= 0) return `${m}\u00a0min`;
  return m === 0
    ? `${h}\u00a0h`
    : `${h}\u00a0h\u00a0${String(m).padStart(2, "0")}`;
}
