import {
  SALES_PROFILE_DIMENSION_KEYS,
  type SalesProfileDimensionKey,
  type SalesProfileScores,
} from "./sales-profile-from-meetings";
import {
  displayedNoteOn5,
  NOTE_ON5_MAX,
  type RankingTier,
} from "./team-ranking";

/**
 * Ce que le manager lit de son équipe prise comme un tout · règles pures.
 *
 * Le tableau « Mon équipe » répond déjà à « qui ? », ligne par ligne. Il ne
 * répond pas à « comment va l'équipe ? », et la seule réponse collective de
 * l'écran est une moyenne, qui est précisément le chiffre qui cache le plus de
 * choses : 3,7 de moyenne, ce sont cinq personnes à 3,7, ou deux à 4,6 et trois
 * à 3,1, et ces deux équipes ne se pilotent pas pareil. Ce fichier tient les
 * deux calculs qui rendent visible ce que la moyenne avale : la dispersion des
 * membres autour d'elle, et le relief des six compétences de l'équipe.
 *
 * Rien ici ne dessine : les deux fonctions rendent des nombres déjà arrondis
 * comme ils s'affichent, pour que le lecteur puisse toujours refaire à la main
 * la soustraction qu'on lui présente.
 */

/** Une compétence de l'équipe, à côté du niveau général de cette équipe. */
export type TeamSkillBar = {
  readonly key: SalesProfileDimensionKey;
  /** Note d'équipe sur l'échelle 0–100, arrondie comme elle s'affiche. */
  readonly valeur: number;
  /** Écart au niveau moyen de l'équipe, en points de la même échelle. */
  readonly ecart: number;
};

export type TeamSkillOverview = {
  /** Les six compétences, de la plus haute à la plus basse. */
  readonly bars: readonly TeamSkillBar[];
  /**
   * Le niveau de l'équipe tous gestes confondus : la moyenne des six.
   *
   * C'est la référence à laquelle les six barres se comparent, et elle est
   * gratuite : elle sort des mêmes notes, sans aller rechercher une période
   * précédente que le plafond de chargement des rendez-vous rendrait
   * incomparable d'un mois à l'autre.
   */
  readonly niveauMoyen: number;
  /**
   * La plus haute et la plus basse, quand elles diffèrent.
   *
   * `null` quand les six compétences sont au même niveau : nommer un point fort
   * dans ce cas inventerait un relief que la donnée ne porte pas.
   */
  readonly relief: {
    readonly fort: TeamSkillBar;
    readonly faible: TeamSkillBar;
  } | null;
};

/**
 * Le relief des six compétences d'une équipe.
 *
 * `reference` est la moyenne d'équipe calculée un vote par commercial, celle-là
 * même à laquelle chaque commercial est comparé dans la colonne « Profil ». Les
 * deux lectures disent donc la même chose dans la même échelle : « Camille est
 * à +17 de son équipe » et « l'équipe est à +8 de son propre niveau ».
 *
 * `null` quand aucun commercial n'est noté : il n'y a alors pas d'équipe à
 * décrire, et six barres à zéro se liraient comme une équipe nulle.
 *
 * À valeur égale, l'ordre des six dimensions tranche, jamais l'ordre de
 * parcours d'un objet : deux affichages de la même période doivent ranger les
 * barres pareil.
 */
export function teamSkillOverview(
  reference: SalesProfileScores | null,
): TeamSkillOverview | null {
  if (reference == null) return null;

  const brutes = SALES_PROFILE_DIMENSION_KEYS.map((key) => ({
    key,
    valeur: Math.round(reference[key]),
  }));
  const niveauMoyen = Math.round(
    SALES_PROFILE_DIMENSION_KEYS.reduce((acc, key) => acc + reference[key], 0) /
      SALES_PROFILE_DIMENSION_KEYS.length,
  );

  /*
    L'écart se fait entre les deux nombres affichés, pas entre les deux valeurs
    brutes : le lecteur a la barre et la référence sous les yeux, et doit
    pouvoir retrouver l'écart en les soustrayant.
  */
  const bars: TeamSkillBar[] = brutes
    .map((b) => ({ ...b, ecart: b.valeur - niveauMoyen }))
    .sort((a, b) => {
      if (b.valeur !== a.valeur) return b.valeur - a.valeur;
      return (
        SALES_PROFILE_DIMENSION_KEYS.indexOf(a.key) -
        SALES_PROFILE_DIMENSION_KEYS.indexOf(b.key)
      );
    });

  const fort = bars[0]!;
  const faible = bars[bars.length - 1]!;

  return {
    bars,
    niveauMoyen,
    relief: fort.valeur === faible.valeur ? null : { fort, faible },
  };
}

/** Un membre à placer sur l'axe des notes. */
export type TeamDispersionEntry = {
  readonly cle: string;
  /** Ce qui le nomme à l'écran : son nom complet, ou son e-mail à défaut. */
  readonly libelle: string;
  readonly noteOn5: number;
  readonly rang: number;
};

export type TeamDispersionDot = TeamDispersionEntry & {
  /** Note affichée, celle qui place le point sur l'axe. */
  readonly valeur: number;
  /**
   * Une strate d'empilement par largeur de piste demandée, dans l'ordre où les
   * largeurs ont été passées. 0 est la strate du bas, celle qui touche l'axe.
   */
  readonly strates: readonly number[];
};

/**
 * Deux pastilles voisines ne se touchent pas : ce filet de fond les sépare.
 * Deux pixels, la même respiration que celle posée entre deux barres empilées
 * partout ailleurs dans le produit.
 */
const RESPIRATION_PX = 2;

/**
 * De combien une comparaison d'écarts a le droit de se tromper.
 *
 * Les notes sont arrondies au dixième avant d'arriver ici : deux notes
 * différentes sont donc séparées d'au moins 0,1. Leur soustraction, elle,
 * n'est pas exacte en virgule flottante, et 4,3 − 3,8 vaut
 * 0,4999999999999996. Sans cette marge, une paire posée exactement à l'écart
 * minimal perdrait la comparaison et gravirait une strate dont elle n'a pas
 * besoin. Un milliardième absorbe l'imprécision tout en restant cent millions
 * de fois plus fin que le dixième qui sépare deux notes : aucune paire que
 * l'écran distingue ne peut passer au travers.
 */
const MARGE_VIRGULE_FLOTTANTE = 1e-9;

/**
 * À partir de quel écart de note deux pastilles cessent de se chevaucher.
 *
 * La question est de dessin, pas de donnée : elle dépend de la largeur qu'une
 * carte réserve à l'échelle 0 à 5 et de la taille de ses pastilles. La carte
 * qui dessine la piste appelle cette fonction avec ses propres mesures, plutôt
 * que de recopier un nombre qui cesserait d'être vrai au premier changement de
 * gabarit.
 *
 * Un empilement calculé pour une largeur donnée reste valable sur toute piste
 * plus large : élargir la piste écarte les pastilles, cela n'en rapproche
 * jamais deux. La carte peut donc se contenter de quelques largeurs de
 * référence plutôt que d'une par pixel.
 */
export function ecartMinimalSurPiste(
  largeurPistePx: number,
  pastillePx: number,
): number {
  return (NOTE_ON5_MAX * (pastillePx + RESPIRATION_PX)) / largeurPistePx;
}

/**
 * Range les membres classés en strates, de sorte qu'aucune pastille n'en
 * recouvre une autre.
 *
 * L'empilement est la seule information ajoutée : trois pastilles l'une sur
 * l'autre à 3,7 disent d'un coup d'œil que l'équipe est groupée là, et deux
 * pastilles isolées aux extrémités disent l'inverse. La règle est simple et
 * volontairement stupide : on parcourt les membres de la note la plus basse à
 * la plus haute, et chacun descend dans la strate la plus basse encore libre à
 * cet endroit de l'axe.
 *
 * L'ordre de sortie est celui de l'axe, de gauche à droite : c'est aussi
 * l'ordre dans lequel un lecteur d'écran les entendra.
 *
 * Ne recevoir que les membres classés est voulu : la moyenne affichée au-dessus
 * ne porte que sur eux, et poser à côté d'elle un point qui n'y participe pas
 * ferait mentir la position de la ligne.
 *
 * L'empilement est recommencé pour chaque écart reçu, parce qu'une piste large
 * sépare des notes qu'une piste de téléphone doit superposer : le même écart de
 * 0,3 point vaut 66 pixels sur un écran de bureau et 14 sur le plus petit
 * téléphone. Un empilement calculé pour le téléphone reste juste sur le bureau,
 * mais il y monte en escalier là où il avait toute la place de rester à plat,
 * et l'œil lit cet escalier comme une tendance alors qu'il n'encode rien. Les
 * strates voyagent donc ensemble jusqu'à la feuille de style, qui choisit celle
 * qui convient à la largeur réellement obtenue.
 *
 * Les écarts viennent de `ecartMinimalSurPiste`, appelée par la carte avec ses
 * propres mesures.
 */
export function teamDispersionDots(
  entries: readonly TeamDispersionEntry[],
  ecartMinimalParLargeur: readonly number[],
): TeamDispersionDot[] {
  const ordonnes = ordonnerSurAxe(entries);
  const valeurs = ordonnes.map((d) => d.valeur);
  const parEcart = ecartMinimalParLargeur.map((ecart) =>
    placerEnStrates(valeurs, ecart),
  );
  return ordonnes.map((dot, index) => ({
    ...dot,
    strates: parEcart.map((strates) => strates[index]!),
  }));
}

/** L'ordre de l'axe, de gauche à droite, avec les notes arrondies comme elles s'affichent. */
function ordonnerSurAxe(
  entries: readonly TeamDispersionEntry[],
): (TeamDispersionEntry & { valeur: number })[] {
  return entries
    .map((e) => ({ ...e, valeur: displayedNoteOn5(e.noteOn5) }))
    .sort((a, b) => {
      if (a.valeur !== b.valeur) return a.valeur - b.valeur;
      const parNom = a.libelle.localeCompare(b.libelle, "fr");
      return parNom !== 0 ? parNom : a.cle.localeCompare(b.cle);
    });
}

/**
 * La règle d'empilement, sur des notes déjà rangées de la plus basse à la plus
 * haute : chacune descend dans la strate la plus basse encore libre à cet
 * endroit de l'axe.
 */
function placerEnStrates(
  valeurs: readonly number[],
  ecartMinimal: number,
): number[] {
  /*
    La dernière valeur posée dans chaque strate suffit à savoir si la strate est
    libre : on avance par notes croissantes, donc la pastille la plus à droite
    d'une strate est toujours la dernière qu'on y a mise.
  */
  const dernierParStrate: number[] = [];

  return valeurs.map((valeur) => {
    let strate = 0;
    while (
      dernierParStrate[strate] != null &&
      valeur - dernierParStrate[strate]! <
        ecartMinimal - MARGE_VIRGULE_FLOTTANTE
    ) {
      strate += 1;
    }
    dernierParStrate[strate] = valeur;
    return strate;
  });
}

/**
 * Nombre de strates occupées, une par largeur demandée, pour réserver la
 * hauteur de la piste dans chacune.
 *
 * Rend un tableau vide sur une piste vide : il n'y a alors aucune largeur à
 * décrire, et c'est au dessin de dire quelle hauteur il réserve quand personne
 * n'est classé.
 */
export function nombreDeStratesParLargeur(
  dots: readonly TeamDispersionDot[],
): number[] {
  const compte: number[] = [];
  for (const dot of dots) {
    dot.strates.forEach((strate, index) => {
      compte[index] = Math.max(compte[index] ?? 0, strate + 1);
    });
  }
  return compte;
}

/**
 * Combien de membres de la piste atteignent au moins un palier donné.
 *
 * Le compte se prend sur les points de la piste et jamais sur les lignes du
 * tableau : le tableau est paginé, la piste porte toute l'équipe classée. Lu
 * sur la page en cours, le même chiffre dirait « 3 » sur la première page et
 * « 2 » sur la seconde, pour la même équipe et le même jour.
 *
 * La comparaison se fait sur la note affichée, comme partout ailleurs : un
 * membre qui lit 3 à l'écran est au palier qui commence à 3, même si sa moyenne
 * brute vaut 2,96. Compter autrement produirait un total que le lecteur ne
 * pourrait pas refaire en regardant les pastilles.
 *
 * La borne haute du palier n'est pas regardée : la question posée est « qui est
 * au moins à ce niveau », donc les paliers au-dessus comptent aussi.
 */
export function membresAuPalier(
  dots: readonly TeamDispersionDot[],
  palier: RankingTier,
): number {
  return dots.filter((dot) => dot.valeur >= palier.minNoteOn5).length;
}

/** Ce que la piste couvre : la note la plus basse, la plus haute, leur écart. */
export type AmplitudeDesNotes = {
  readonly basse: number;
  readonly haute: number;
  /** Écart entre les deux, dans la même unité et arrondi comme elles. */
  readonly amplitude: number;
};

/**
 * L'étalement d'une équipe sur l'axe des notes.
 *
 * C'est le chiffre qui manque à côté de la moyenne : « 3,7 de moyenne » ne dit
 * pas si l'équipe tient dans un dixième ou s'étale sur deux points, et ces deux
 * équipes-là n'appellent pas le même coaching.
 *
 * L'écart est arrondi comme les notes qu'il sépare, et pas seulement soustrait :
 * 4,3 − 3,1 vaut 1,2000000000000002 en virgule flottante, et ce nombre-là ne
 * doit jamais atteindre l'écran.
 *
 * Les deux bornes se cherchent plutôt que se lire aux extrémités : la fonction
 * dit alors la même chose quel que soit l'ordre reçu, et ne dépend pas du tri
 * d'une autre fonction pour rester juste.
 *
 * `null` sur une piste vide : il n'y a alors pas d'étalement à mesurer.
 */
export function amplitudeDesNotes(
  dots: readonly TeamDispersionDot[],
): AmplitudeDesNotes | null {
  if (dots.length === 0) return null;

  let basse = dots[0]!.valeur;
  let haute = basse;
  for (const dot of dots) {
    if (dot.valeur < basse) basse = dot.valeur;
    if (dot.valeur > haute) haute = dot.valeur;
  }
  return { basse, haute, amplitude: displayedNoteOn5(haute - basse) };
}
