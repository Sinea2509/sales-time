import { SCORECARD_LEVEL_MAX, type ScorecardGrid } from "./scorecard-grid";

/**
 * Le calcul du score d'une scorecard, à partir des seuls niveaux.
 *
 * Le modèle ne rend aucun total. Il note chaque critère de 0 à 4, et c'est
 * tout. La consigne d'origine lui demandait de sommer ses propres notes, de les
 * ramener au maximum du bloc puis d'additionner les cinq blocs, en le priant
 * de « calculer soigneusement » : trois occasions de se tromper sur un chiffre
 * que le produit affiche ensuite comme une mesure, et aucun moyen de savoir
 * qu'il s'est trompé. Ici l'arithmétique est faite par la machine, elle est
 * juste par construction, et elle se teste.
 */

/** Le niveau attribué à un critère, tel que le modèle le rend. */
export type ScorecardLevel = {
  readonly key: string;
  readonly level: number;
};

/** Le score d'un bloc, entier, et le maximum qu'il pouvait atteindre. */
export type ScorecardBlockScore = {
  readonly key: string;
  readonly name: string;
  readonly score: number;
  readonly max: number;
};

export type ScorecardScore = {
  readonly blocks: readonly ScorecardBlockScore[];
  /** Somme des scores de blocs, sur 100. */
  readonly overallScore: number;
};

/**
 * Ramène un niveau reçu dans l'échelle, quoi qu'il arrive.
 *
 * Le schéma de génération borne déjà le niveau entre 0 et 4, mais la même
 * fonction sert à relire des analyses enregistrées il y a des mois, dont le
 * schéma de lecture est volontairement tolérant. Un niveau absent, négatif ou
 * fantaisiste vaut 0 : c'est la lecture la moins généreuse, celle qui ne peut
 * pas gonfler un score par accident.
 */
export function scorecardNormalizedLevel(raw: number): number {
  if (!Number.isFinite(raw)) return 0;
  const arrondi = Math.round(raw);
  if (arrondi <= 0) return 0;
  if (arrondi > SCORECARD_LEVEL_MAX) return SCORECARD_LEVEL_MAX;
  return arrondi;
}

/**
 * Les niveaux rangés par clé de critère, doublons tranchés vers le bas.
 *
 * Deux entrées pour « B3 » sont une bévue du modèle, pas une intention. Garder
 * la plus basse suit la règle qui gouverne toute la grille : dans le doute, on
 * ne monte pas. La clé est mise en majuscules parce qu'un modèle qui répond
 * « b3 » désigne le même critère et ne mérite pas de perdre la note.
 */
export function scorecardLevelsByKey(
  levels: readonly ScorecardLevel[],
): Map<string, number> {
  const parCle = new Map<string, number>();
  for (const entry of levels) {
    const cle = entry.key.trim().toUpperCase();
    if (!cle) continue;
    const niveau = scorecardNormalizedLevel(entry.level);
    const connu = parCle.get(cle);
    parCle.set(cle, connu == null ? niveau : Math.min(connu, niveau));
  }
  return parCle;
}

/**
 * Le score de chaque bloc et le total, sur 100.
 *
 * Un critère que le modèle n'a pas rendu vaut 0, comme un critère qu'il a rendu
 * à 0 : la consigne dit qu'un critère sans preuve dans le transcript vaut zéro,
 * et l'omettre est la façon la plus courante de ne pas avoir de preuve. Une
 * clé inconnue de la grille est ignorée, faute de savoir à quel bloc l'ajouter.
 *
 * Les scores de blocs sont des entiers, et leur somme est exactement le score
 * global. Ce n'est pas une élégance : la fiche montre les deux à côté l'un de
 * l'autre, et cinq nombres arrondis chacun de son côté ne tombent pas sur leur
 * propre total une fois sur deux. Les points perdus à l'arrondi sont rendus aux
 * blocs dont la part décimale est la plus forte, à égalité au premier bloc.
 * Avec des poids valant quatre fois le nombre de critères, comme la grille de
 * découverte, aucune décimale n'apparaît et ce partage ne fait rien.
 *
 * Aucun bloc ne peut dépasser son poids, et rien ici ne le retient : la valeur
 * exacte d'un bloc ne dépasse jamais son poids, si bien qu'un bloc à qui il
 * reste une part décimale est au moins un point sous son maximum. Le nombre de
 * points à rendre ne dépasse pas le nombre de blocs qui en ont une, et un bloc
 * tombé juste n'est donc jamais servi. Un garde-fou aurait ici l'apparence
 * d'une précaution et la nature d'une ligne morte, jamais franchie et jamais
 * vérifiée ; c'est un test qui énonce la propriété.
 */
export function computeScorecardScore(
  grid: ScorecardGrid,
  levels: readonly ScorecardLevel[],
): ScorecardScore {
  const parCle = scorecardLevelsByKey(levels);

  const exacts = grid.blocks.map((block) => {
    const somme = block.criteria.reduce(
      (total, criterion) =>
        total + (parCle.get(criterion.key.toUpperCase()) ?? 0),
      0,
    );
    const diviseur = SCORECARD_LEVEL_MAX * block.criteria.length;
    return diviseur > 0 ? (block.weight * somme) / diviseur : 0;
  });

  const planchers = exacts.map((valeur) => Math.floor(valeur));
  const scores = [...planchers];
  const somme = (valeurs: readonly number[]) =>
    valeurs.reduce((total, valeur) => total + valeur, 0);
  let reste = Math.round(somme(exacts)) - somme(planchers);

  // Le tri est stable depuis ES2019 : à parts égales, les blocs resteraient
  // déjà dans l'ordre de la grille sans qu'on écrive rien, et aucun test ne
  // peut donc distinguer ce départage de son absence. Il est écrit quand même,
  // parce qu'il énonce la règle au lieu de la faire reposer sur une propriété
  // du tri que le lecteur devrait connaître.
  const ordre = exacts
    .map((valeur, index) => ({ index, part: valeur - Math.floor(valeur) }))
    .sort((a, b) => b.part - a.part || a.index - b.index);

  for (const { index } of ordre) {
    if (reste <= 0) break;
    const courant = scores[index];
    // Exigé par le typage, jamais franchi : l'index vient de la liste elle-même.
    if (courant == null) continue;
    scores[index] = courant + 1;
    reste -= 1;
  }

  const blocks = grid.blocks.map((block, index) => ({
    key: block.key,
    name: block.name,
    score: scores[index] ?? 0,
    max: block.weight,
  }));

  return { blocks, overallScore: somme(blocks.map((block) => block.score)) };
}
