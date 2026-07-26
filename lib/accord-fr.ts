/**
 * Les dénombrements de la vue équipe, écrits une fois avec leur accord.
 *
 * En français, zéro et un prennent le singulier, deux et au-delà le pluriel :
 * « 0 membre », « 1 membre », « 2 membres ». La règle est courte, et c'est
 * précisément pourquoi elle se perd : trois écrans de la vue manager
 * composaient chacun ses phrases de leur côté, et l'un d'eux affichait
 * « moyenne des 1 membre classés » le jour où une équipe démarre avec une
 * seule personne notée.
 *
 * Chaque phrase est donc rendue entière plutôt qu'assemblée dans le rendu : un
 * participe s'accorde avec son nom, et coller « classés » derrière un
 * « 1 membre » calculé ailleurs est exactement ce qui produit la faute.
 */

/** « 0 membre », « 1 membre », « 7 membres ». */
export function membres(n: number): string {
  return n <= 1 ? `${n} membre` : `${n} membres`;
}

/** « 1 membre classé », « 7 membres classés ». */
export function membresClasses(n: number): string {
  return n <= 1 ? `${n} membre classé` : `${n} membres classés`;
}

/** « 1 RDV noté », « 8 RDV notés ». */
export function rdvNotes(n: number): string {
  return n <= 1 ? `${n} RDV noté` : `${n} RDV notés`;
}
