import {
  RANKING_TIERS,
  tierFromSalesScore,
  type RankingTierId,
} from "@/src/core/domain/team-ranking";

/**
 * Proprietary meeting metric (0–100), derived from the average of SONCAS driver scores.
 * Use only for `salesScore` / aggregated SalesScore KPIs, not for KISS coaching (0–10),
 * DISC/SONCAS profile percentages, or other framework-specific scores.
 */
export const SALES_SCORE_LABEL = "SalesScore";

/** KISS coaching performance on a single meeting (0–10). Not a SalesScore. */
export const KISS_COACHING_SCORE_LABEL = "Score KISS";

/**
 * La couleur d'un SalesScore, décidée par le palier que ce score atteint.
 *
 * Les seuils étaient écrits ici, 50 puis 70, alors que le produit place ses
 * paliers à 40, 60 et 80. Un même écran montrait donc un rendez-vous à 65 en
 * ambre, couleur de la vigilance, pendant que ce même 65 rangeait un commercial
 * en « Maîtrise » deux colonnes plus loin. Deux découpages du même nombre, dont
 * aucun n'était annoncé au lecteur. Les bornes viennent maintenant de
 * `RANKING_TIERS`, écrites une seule fois dans tout le produit.
 *
 * Les classes sont rangées par identifiant de palier plutôt que derrière une
 * suite de comparaisons : un palier ajouté demain ne passera pas le typage tant
 * qu'on ne lui aura pas donné sa couleur, au lieu de tomber sans bruit dans la
 * dernière branche et d'y prendre celle du palier précédent.
 *
 * Quatre paliers pour trois couleurs : Maîtrise et Excellence partagent le vert.
 * La couleur est un signal grossier, lu d'un coup d'œil le long d'une liste ;
 * c'est le nom du palier qui porte la nuance, là où il est affiché.
 */
const CLASSE_TEXTE: Readonly<Record<RankingTierId, string>> = {
  demarrage: "text-red-600 dark:text-red-400",
  progression: "text-amber-600 dark:text-amber-400",
  maitrise: "text-emerald-600 dark:text-emerald-400",
  excellence: "text-emerald-600 dark:text-emerald-400",
};

/**
 * Le remplissage d'une barre de SalesScore, aux mêmes paliers que le texte.
 *
 * Une barre et un chiffre qui décrivent le même score doivent en dire la même
 * chose : une barre de marque sous un 47 écrit en rouge racontait deux
 * histoires. Les trois remplissages tiennent le seuil de 3:1 exigé d'un
 * composant graphique sur fond blanc : rouge 4,83:1, ambre 3,19:1, vert
 * 3,77:1, mesurés sur le thème clair, seul thème optimisé. Le passage aux
 * paliers déplace les bornes, pas la palette : ces trois mesures valent encore.
 */
const CLASSE_BARRE: Readonly<Record<RankingTierId, string>> = {
  demarrage: "bg-red-600 dark:bg-red-500",
  progression: "bg-amber-600 dark:bg-amber-500",
  maitrise: "bg-emerald-600 dark:bg-emerald-500",
  excellence: "bg-emerald-600 dark:bg-emerald-500",
};

/**
 * Le palier le plus bas, seule réponse tenable devant un score qui n'en est pas
 * un.
 *
 * `tierFromSalesScore` ne rend `null` que pour une valeur non finie, que le
 * modèle de données ne produit pas : `salesScore` vaut un entier ou `null`, et
 * les appelants écartent le `null` avant d'appeler. La branche existe quand
 * même, parce que rendre une classe vide effacerait le chiffre sur le fond
 * ivoire de la charte. Le palier le plus bas est retenu parce qu'il est le seul
 * qui ne flatte pas un nombre que personne ne saurait justifier.
 */
const PALIER_DE_REPLI: RankingTierId = RANKING_TIERS[0]?.id ?? "demarrage";

function classeDuPalier(
  score: number,
  classes: Readonly<Record<RankingTierId, string>>,
): string {
  const palier = tierFromSalesScore(score);
  return classes[palier?.id ?? PALIER_DE_REPLI];
}

/** Tailwind text color for a nude SalesScore (0–100). */
export function salesScoreColorClass(score: number): string {
  return classeDuPalier(score, CLASSE_TEXTE);
}

/** Tailwind fill for a SalesScore bar (0–100). */
export function salesScoreBarClass(score: number): string {
  return classeDuPalier(score, CLASSE_BARRE);
}
