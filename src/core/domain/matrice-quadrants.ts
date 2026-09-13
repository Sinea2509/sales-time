/**
 * Les quatre quadrants de la matrice « Qualification × Potentiel ».
 *
 * Les deux axes sont signés et se croisent à zéro : le graphique dessinait
 * donc déjà quatre quadrants, matérialisés par une croix en pointillés, mais
 * aucun ne portait de nom. Le lecteur voyait un nuage de points coupé en
 * quatre et devait deviner seul ce que valait un point en haut à gauche.
 *
 * Nommer les quadrants ne déplace aucun point : cela rend lisible une
 * structure qui était déjà dessinée.
 */

export type CoinDeMatrice =
  | "haut-gauche"
  | "haut-droite"
  | "bas-gauche"
  | "bas-droite";

export type QuadrantMatrice = {
  /** Identifiant stable : clé React et clé de test, jamais affiché. */
  cle: "requalifier" | "prioriser" | "arbitrer" | "conclure";
  /** Ce que le commercial a à faire de ce rendez-vous. */
  action: string;
  /** Pourquoi, en une phrase, dans le vocabulaire des deux axes. */
  raison: string;
  coin: CoinDeMatrice;
};

export const QUADRANTS_MATRICE: readonly QuadrantMatrice[] = [
  {
    cle: "requalifier",
    action: "À requalifier",
    raison:
      "Le montant est parmi les plus élevés de la période, la qualification n'est pas encore au niveau.",
    coin: "haut-gauche",
  },
  {
    cle: "prioriser",
    action: "À prioriser",
    raison:
      "Bien qualifié et parmi les plus gros montants de la période : c'est là que le temps rapporte le plus.",
    coin: "haut-droite",
  },
  {
    cle: "arbitrer",
    action: "À arbitrer",
    raison:
      "Peu qualifié et montant modeste : décider s'il mérite un rendez-vous de plus.",
    coin: "bas-gauche",
  },
  {
    cle: "conclure",
    action: "À conclure",
    raison:
      "Bien qualifié, montant modeste : rien ne justifie de le laisser traîner.",
    coin: "bas-droite",
  },
] as const;

/**
 * Le quadrant d'un point, ou rien s'il est posé sur un axe.
 *
 * Un point exactement sur une des deux lignes n'appartient à aucun des deux
 * quadrants qu'elle sépare, et le cas n'a rien de théorique : l'abscisse zéro,
 * c'est le SalesScore 50, une note ronde que beaucoup de rendez-vous portent.
 * Le ranger d'un côté par convention ferait dire au graphique une chose que la
 * mesure ne dit pas.
 */
export function quadrantDeLaMatrice(point: {
  qualification: number;
  potential: number;
}): QuadrantMatrice | null {
  if (point.qualification === 0 || point.potential === 0) return null;

  const coin: CoinDeMatrice =
    point.potential > 0
      ? point.qualification > 0
        ? "haut-droite"
        : "haut-gauche"
      : point.qualification > 0
        ? "bas-droite"
        : "bas-gauche";

  return QUADRANTS_MATRICE.find((q) => q.coin === coin) ?? null;
}
