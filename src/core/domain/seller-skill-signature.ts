import {
  SALES_PROFILE_DIMENSION_KEYS,
  type SalesProfileDimensionKey,
  type SalesProfileScores,
} from "./sales-profile-from-meetings";

/**
 * Le nom de chacune des six compétences du commercial.
 *
 * Ces six mots parlent du vendeur, et de personne d'autre. Aucun ne peut
 * emprunter au vocabulaire SONCAS ni au vocabulaire DISC, qui décrivent le
 * prospect : sur un écran où « Sécurité » voisine « Assertivité », le lecteur
 * lit deux traits du même commercial, alors que le premier décrit ses
 * acheteurs. La compétence `capitalSympathie` s'appelle donc « Lien de
 * confiance » et non « Sympathie », qui est un levier SONCAS ; `nextSteps`
 * s'appelle « Engagement obtenu » et non « Prochaine étape », parce que le mot
 * « étape » désigne partout ailleurs l'étape de vente du rendez-vous. Les deux
 * noms retenus disent d'ailleurs ce que la consigne d'analyse note vraiment :
 * la confiance construite du début à la fin, et l'engagement daté arraché avant
 * de raccrocher.
 *
 * Tout nom ajouté ici se vérifie contre `SONCAS_LABEL_FR`, `DISC_LABEL_FR` et
 * les noms de paliers. Le test voisin le vérifie pour vous.
 */
export const SELLER_SKILL_LABEL_FR: Record<SalesProfileDimensionKey, string> = {
  assertivite: "Assertivité",
  ecouteActive: "Écoute active",
  capitalSympathie: "Lien de confiance",
  argumentation: "Argumentation",
  objections: "Traitement des objections",
  nextSteps: "Engagement obtenu",
};

/**
 * Les mêmes six compétences, à la longueur d'un sommet de radar.
 *
 * Un radar pose ses libellés autour du tracé, sans les replier : un nom trop
 * long chevauche son voisin ou sort de la carte. Ces formes courtes existent
 * pour cet emplacement précis, et pour lui seul ; partout où la place ne manque
 * pas, c'est `SELLER_SKILL_LABEL_FR` qui parle, en entier. Aucune n'est un
 * mot tronqué suivi d'un point : « Argument. » demandait au lecteur de deviner
 * la fin, et le radar la connaît.
 */
export const SELLER_SKILL_SHORT_FR: Record<SalesProfileDimensionKey, string> = {
  assertivite: "Assertivité",
  ecouteActive: "Écoute",
  capitalSympathie: "Lien",
  argumentation: "Argumentation",
  objections: "Objections",
  nextSteps: "Engagement",
};

/**
 * Ce qui distingue un commercial des autres : sa compétence la plus au-dessus
 * de la référence, et la plus au-dessous.
 *
 * La moyenne d'un commercial ne le distingue pas. Deux personnes notées 62
 * peuvent porter la découverte et lâcher la conclusion, ou l'inverse : c'est la
 * forme qui les sépare, pas le niveau. Ces deux extrêmes sont la plus courte
 * description utile de cette forme, et la seule qui tienne dans une ligne de
 * tableau.
 */
export type SellerSkillSignature = {
  fort: SalesProfileDimensionKey;
  /** Écart à la référence, en points de l'échelle 0–100 des compétences. */
  ecartFort: number;
  faible: SalesProfileDimensionKey;
  ecartFaible: number;
};

/**
 * La moyenne de plusieurs jeux de six notes, dimension par dimension.
 *
 * Chaque élément de la liste pèse exactement le même poids, et c'est
 * l'appelant qui décide de ce qu'un élément représente. Deux emplois, deux
 * décisions : la moyenne d'un commercial prend un élément par rendez-vous, la
 * référence d'équipe prend un élément par commercial. La seconde ne doit
 * surtout pas s'écrire avec les rendez-vous de tout le monde en vrac, sans quoi
 * le plus gros porteur de volume fixerait seul la barre à laquelle on le
 * compare ensuite : sur une équipe où l'un tient trente rendez-vous et les cinq
 * autres cinq, il pèserait la moitié de sa propre référence.
 *
 * Les valeurs ne sont pas arrondies : elles servent à calculer un écart, qui
 * s'arrondit une fois, au moment de l'écrire.
 *
 * `null` quand la liste ne contient aucune note : il n'y a alors rien à
 * moyenner, et cette fonction le dit plutôt que de rendre six zéros.
 */
export function averageSkillScores(
  sets: readonly (SalesProfileScores | null)[],
): SalesProfileScores | null {
  const notes = sets.filter((s): s is SalesProfileScores => s != null);
  if (notes.length === 0) return null;

  const moyenne = {} as SalesProfileScores;
  for (const key of SALES_PROFILE_DIMENSION_KEYS) {
    moyenne[key] = notes.reduce((acc, s) => acc + s[key], 0) / notes.length;
  }
  return moyenne;
}

/**
 * Les deux extrêmes d'un commercial face à une référence.
 *
 * `null` a trois causes, et toutes les trois veulent dire « rien à en dire »
 * plutôt que « rien à signaler » : le commercial n'a aucun rendez-vous noté, la
 * référence n'existe pas, ou les six écarts sont égaux. Ce dernier cas est
 * exactement celui du commercial seul de son équipe à être noté : il est alors
 * sa propre référence, ses six écarts valent zéro, et le désigner un point fort
 * reviendrait à inventer une comparaison qui n'a pas eu lieu.
 *
 * À écart égal, c'est l'ordre fixe des six dimensions qui tranche, jamais le
 * hasard de parcours d'un objet : deux affichages de la même période doivent
 * nommer la même compétence.
 */
export function sellerSkillSignature(
  scores: SalesProfileScores | null,
  reference: SalesProfileScores | null,
): SellerSkillSignature | null {
  if (scores == null || reference == null) return null;

  const premiere = SALES_PROFILE_DIMENSION_KEYS[0]!;
  let fort = premiere;
  let faible = premiere;
  let ecartFort = Math.round(scores[premiere] - reference[premiere]);
  let ecartFaible = ecartFort;

  for (const key of SALES_PROFILE_DIMENSION_KEYS) {
    const ecart = Math.round(scores[key] - reference[key]);
    if (ecart > ecartFort) {
      fort = key;
      ecartFort = ecart;
    }
    if (ecart < ecartFaible) {
      faible = key;
      ecartFaible = ecart;
    }
  }

  if (fort === faible) return null;
  return { fort, ecartFort, faible, ecartFaible };
}

/** L'écart signé tel qu'il s'écrit à l'écran, avec le vrai signe moins. */
export function formatEcartCompetence(ecart: number): string {
  if (ecart > 0) return `+${ecart}`;
  if (ecart < 0) return `−${Math.abs(ecart)}`;
  return "0";
}
