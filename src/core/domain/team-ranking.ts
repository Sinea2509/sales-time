/**
 * Classement d'équipe · règles pures.
 *
 * Le classement affiché au manager repose sur quatre décisions, prises ici et
 * nulle part ailleurs dans l'application :
 *
 * 1. Un membre n'entre au classement qu'au-delà d'un volume minimum de rendez-vous
 *    notés. En dessous il garde son score, mais ni rang ni palier. Classer
 *    quelqu'un sur un seul rendez-vous produit un rang que le mois suivant dément,
 *    et le décorer sur un seul rendez-vous produit un insigne qui ment tout de
 *    suite, puisqu'il paraît valoir celui du membre évalué sur douze.
 * 2. Les ex æquo partagent le même rang et le rang suivant saute : 1, 1, 3.
 * 3. Le rang, la moyenne et les écarts se calculent sur les valeurs *affichées*,
 *    arrondies au dixième. Deux membres qui affichent 3,5 sont donc ex æquo même
 *    si leurs moyennes brutes diffèrent, et tout écart cité dans une phrase est la
 *    différence de deux nombres que le lecteur a sous les yeux.
 * 4. La moyenne d'équipe ne porte que sur les membres classés. Y mêler un membre
 *    évalué sur un seul rendez-vous déplacerait la référence de toute l'équipe.
 *
 * Aucun libellé de ce fichier ne suppose le genre d'un membre : la base ne le
 * porte pas, et le déduire d'un prénom serait faux une fois sur deux.
 */

export type RankingTierId =
  | "demarrage"
  | "progression"
  | "maitrise"
  | "excellence";

export type RankingTier = {
  readonly id: RankingTierId;
  /** Nom du palier. Un nom, jamais un adjectif : il ne s'accorde avec personne. */
  readonly nom: string;
  /** Borne basse incluse, sur l'échelle /5 affichée au manager. */
  readonly minNoteOn5: number;
  /** Borne haute exclue. `null` sur le dernier palier, qui monte jusqu'à 5. */
  readonly maxNoteOn5: number | null;
};

/**
 * Les quatre paliers du produit. Les bornes /5 correspondent exactement aux
 * bornes SalesScore 40, 60 et 80 sur l'échelle 0–100, puisque la note affichée
 * vaut le SalesScore divisé par 20.
 *
 * Les noms nomment un niveau atteint, jamais une place sur un podium. Une série
 * de médailles serait plus flatteuse, mais elle mentirait deux fois sur le même
 * écran. « Or » veut dire premier partout ailleurs, alors qu'un palier est
 * absolu et se décerne à tous ceux qui sont dans la tranche, pendant que la
 * colonne voisine annonce le vrai rang : on lirait « 3e place · Or » sur la même
 * ligne. Et « Argent » est déjà le nom d'un levier SONCAS, affiché sur les mêmes
 * écrans, si bien que le même mot y désignerait un niveau de performance et une
 * motivation d'achat. Tout nom ajouté ici doit donc être vérifié contre le
 * vocabulaire SONCAS, DISC et les types de rendez-vous avant d'être retenu.
 */
export const RANKING_TIERS: readonly RankingTier[] = [
  { id: "demarrage", nom: "Démarrage", minNoteOn5: 0, maxNoteOn5: 2 },
  { id: "progression", nom: "Progression", minNoteOn5: 2, maxNoteOn5: 3 },
  { id: "maitrise", nom: "Maîtrise", minNoteOn5: 3, maxNoteOn5: 4 },
  { id: "excellence", nom: "Excellence", minNoteOn5: 4, maxNoteOn5: null },
];

/** Note maximale de l'échelle affichée. */
export const NOTE_ON5_MAX = 5;

/**
 * Volume minimum de rendez-vous notés pour entrer au classement.
 * Réglable par organisation ; cette valeur est le défaut du produit.
 */
export const DEFAULT_MIN_SCORED_MEETINGS = 3;

/** Arrondi d'affichage : le dixième de point, comme la note lue à l'écran. */
export function displayedNoteOn5(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Palier correspondant à une note affichée, ou `null` si la note n'existe pas. */
export function tierFromNoteOn5(note: number | null): RankingTier | null {
  if (note == null || !Number.isFinite(note)) return null;
  const shown = displayedNoteOn5(note);
  for (let i = RANKING_TIERS.length - 1; i >= 0; i -= 1) {
    const tier = RANKING_TIERS[i];
    if (tier && shown >= tier.minNoteOn5) return tier;
  }
  return RANKING_TIERS[0] ?? null;
}

/** Ex. « Démarrage : 0 à 1,9 » · « Excellence : 4 à 5 ». */
export function tierRangeLabel(tier: RankingTier): string {
  const hautBrut =
    tier.maxNoteOn5 == null ? NOTE_ON5_MAX : tier.maxNoteOn5 - 0.1;
  return `${tier.nom} : ${formatNoteFr(tier.minNoteOn5)} à ${formatNoteFr(
    displayedNoteOn5(hautBrut),
  )}`;
}

/** Écrit une note à la française, sans zéro décimal inutile : 4 · 3,5 · 1,9. */
export function formatNoteFr(value: number): string {
  const shown = displayedNoteOn5(value);
  return Number.isInteger(shown)
    ? String(shown)
    : String(shown).replace(".", ",");
}

/**
 * Écrit un écart signé : « +1,0 » · « −0,3 » · « 0,0 ».
 *
 * Toujours une décimale, même sur un compte rond. Une colonne où l'on lit
 * « +1 » à côté de « +0,4 » se compare mal : l'œil aligne des chiffres qui n'ont
 * pas le même rang. Le signe négatif est le vrai signe moins (U+2212), pas le
 * trait d'union, qui est plus court et se confond avec une césure.
 */
export function formatDeltaOn5(value: number): string {
  const shown = displayedNoteOn5(value);
  const signe = shown < 0 ? "−" : "+";
  return `${signe}${Math.abs(shown).toFixed(1).replace(".", ",")}`;
}

/** Pourquoi un membre n'a pas de rang. Jamais un rang factice à la place. */
export type UnrankedReason = "sans-note" | "volume-insuffisant";

export type RankableMember = {
  /** Note globale affichée, sur 5. `null` si aucun rendez-vous noté. */
  readonly noteGlobaleOn5: number | null;
  /** Nombre de rendez-vous porteurs d'une note sur la période. */
  readonly scoredMeetings: number;
};

export type MemberRanking = {
  /** Rang au classement, ou `null` si le membre en est écarté. */
  readonly rank: number | null;
  /** Vrai si au moins un autre membre affiche la même note. */
  readonly tied: boolean;
  /**
   * Palier atteint, ou `null` hors classement.
   *
   * Un palier est une distinction, pas une simple traduction de la note : le
   * lecteur ne compare pas deux chiffres, il compare deux insignes. « Excellence »
   * décernée sur un rendez-vous, posée à côté d'« Excellence » décernée sur douze,
   * affirme une égalité que la donnée ne porte pas. Le seuil de volume qui
   * retient le rang retient donc aussi le palier. La note, elle, reste affichée
   * avec le nombre de rendez-vous qui la fonde : rien n'est caché, seule la
   * décoration attend d'être méritée.
   */
  readonly tier: RankingTier | null;
  /**
   * Écart à la moyenne d'équipe, en points affichés. `null` hors classement.
   * Vaut exactement `note affichée − moyenne affichée`.
   */
  readonly deltaToTeamAverage: number | null;
  readonly unrankedReason: UnrankedReason | null;
};

export type TeamRankingSummary = {
  /** Nombre de membres au classement. */
  readonly rankedCount: number;
  /** Nombre de membres écartés du classement, toutes raisons confondues. */
  readonly unrankedCount: number;
  /**
   * Écartés faute de note : aucun rendez-vous noté sur la période.
   *
   * Compté à part de `unrankedLowVolumeCount` parce que les deux appellent des
   * actions opposées. Sans note, il n'y a rien à coacher : il faut d'abord
   * qu'un rendez-vous soit analysé. Avec trop peu de notes, le coaching a
   * commencé et il suffit d'attendre le volume. Une phrase qui additionne les
   * deux envoie la moitié de l'équipe vers la mauvaise action.
   */
  readonly unrankedNoScoreCount: number;
  /** Écartés faute de volume : notés, mais en dessous du seuil. */
  readonly unrankedLowVolumeCount: number;
  /** Moyenne des notes affichées des seuls membres classés. `null` si aucun. */
  readonly averageNoteOn5: number | null;
  /** Seuil de volume appliqué pour ce calcul. */
  readonly minScoredMeetings: number;
};

export type TeamRanking<T> = TeamRankingSummary & {
  /** Une entrée par membre reçu, dans l'ordre d'entrée. */
  readonly rows: readonly (T & MemberRanking)[];
};

function unrankedReasonFor(
  member: RankableMember,
  minScoredMeetings: number,
): UnrankedReason | null {
  if (member.noteGlobaleOn5 == null) return "sans-note";
  if (member.scoredMeetings < minScoredMeetings) return "volume-insuffisant";
  return null;
}

/**
 * Classe une équipe.
 *
 * L'ordre des lignes rendues est celui reçu : c'est l'appelant qui décide de
 * l'ordre d'affichage, et le rang reste juste quel que soit cet ordre. En
 * particulier, il faut appeler cette fonction sur l'équipe **entière** avant de
 * découper en pages, sinon le premier de la deuxième page serait affiché premier.
 */
export function rankTeamMembers<T extends RankableMember>(
  members: readonly T[],
  options: { readonly minScoredMeetings?: number } = {},
): TeamRanking<T> {
  const minScoredMeetings =
    options.minScoredMeetings ?? DEFAULT_MIN_SCORED_MEETINGS;

  const eligible: Array<{ index: number; note: number }> = [];
  let unrankedNoScoreCount = 0;
  let unrankedLowVolumeCount = 0;
  members.forEach((member, index) => {
    const raison = unrankedReasonFor(member, minScoredMeetings);
    if (raison === "sans-note") {
      unrankedNoScoreCount += 1;
      return;
    }
    if (raison === "volume-insuffisant") {
      unrankedLowVolumeCount += 1;
      return;
    }
    if (member.noteGlobaleOn5 == null) return;
    eligible.push({ index, note: displayedNoteOn5(member.noteGlobaleOn5) });
  });

  const averageNoteOn5 =
    eligible.length === 0
      ? null
      : displayedNoteOn5(
          eligible.reduce((acc, e) => acc + e.note, 0) / eligible.length,
        );

  const ordered = [...eligible].sort((a, b) => b.note - a.note);
  const rankByIndex = new Map<number, number>();
  const countByNote = new Map<number, number>();
  ordered.forEach((entry, position) => {
    const previous = ordered[position - 1];
    const rank =
      previous && previous.note === entry.note
        ? (rankByIndex.get(previous.index) ?? position + 1)
        : position + 1;
    rankByIndex.set(entry.index, rank);
    countByNote.set(entry.note, (countByNote.get(entry.note) ?? 0) + 1);
  });

  const rows = members.map((member, index) => {
    const rank = rankByIndex.get(index) ?? null;
    const note = member.noteGlobaleOn5;
    const shown = note == null ? null : displayedNoteOn5(note);
    return {
      ...member,
      rank,
      tied: rank != null && shown != null && (countByNote.get(shown) ?? 0) > 1,
      tier: rank == null ? null : tierFromNoteOn5(note),
      deltaToTeamAverage:
        rank == null || shown == null || averageNoteOn5 == null
          ? null
          : displayedNoteOn5(shown - averageNoteOn5),
      unrankedReason: unrankedReasonFor(member, minScoredMeetings),
    };
  });

  return {
    rows,
    rankedCount: eligible.length,
    unrankedCount: members.length - eligible.length,
    unrankedNoScoreCount,
    unrankedLowVolumeCount,
    averageNoteOn5,
    minScoredMeetings,
  };
}

/** « 1re place » · « 4e place ». Un nom féminin fixe, aucun accord sur la personne. */
export function rankLabel(rank: number): string {
  return rank === 1 ? "1re place" : `${rank}e place`;
}

/**
 * Phrase expliquant l'absence de rang. Accordée sur « membre », jamais sur la
 * personne, et toujours accompagnée du chiffre qui la justifie.
 */
export function unrankedExplanation(
  reason: UnrankedReason,
  scoredMeetings: number,
  minScoredMeetings: number,
): string {
  if (reason === "sans-note") {
    return "Aucun rendez-vous noté sur la période : pas de score, donc ni rang ni palier.";
  }
  const compte =
    scoredMeetings <= 1
      ? `${scoredMeetings} rendez-vous noté`
      : `${scoredMeetings} rendez-vous notés`;
  return `${compte} sur la période, en dessous du seuil de ${minScoredMeetings} : le score reste affiché, le rang et le palier attendent le volume.`;
}
