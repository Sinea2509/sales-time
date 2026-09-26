import type {
  ScorecardBlockAverage,
  ScorecardCriterionShare,
} from "./scorecard-team-axes";

/**
 * La synthèse écrite de l'équipe, telle que la maquette du 11 septembre la
 * pose sur le tableau de bord du manager : quatre paragraphes titrés, avec
 * les chiffres qui les montrent, puis ces chiffres repris en liste.
 *
 * Elle est écrite par le produit, pas par le modèle. Chaque phrase porte un
 * nombre que le manager peut retrouver ailleurs sur la page : l'écart des
 * SalesScores, la part des rendez-vous où un critère manque, le pourcentage
 * d'un bloc chez un commercial et chez l'équipe. Une synthèse dictée par un
 * modèle dirait la même chose avec des chiffres qu'on ne pourrait pas
 * vérifier, et un manager qui ne peut pas vérifier ne cite pas.
 *
 * Aucun libellé ne suppose le genre d'un commercial : la base ne le porte pas.
 */

export type SynthesisSeller = {
  name: string;
  /** Prénom seul quand il existe : c'est ainsi qu'on parle d'un collègue. */
  shortName: string;
  salesScore: number | null;
  scoredMeetings: number;
  /** Moyenne du bloc « Suite et engagement » sur ses scorecards, en pourcentage. */
  engagementPct: number | null;
};

export type TeamWrittenSynthesisInput = {
  analyzedMeetings: number;
  scorecards: number;
  sellers: readonly SynthesisSeller[];
  blockAverages: readonly ScorecardBlockAverage[];
  criterionShares: readonly ScorecardCriterionShare[];
  /** Clé du bloc qui porte la suite datée dans la grille. */
  engagementBlockKey?: string;
};

export type SynthesisParagraph = { title: string; text: string };
export type SynthesisFigure = { label: string; value: string };

export type TeamWrittenSynthesis = {
  paragraphs: SynthesisParagraph[];
  figures: SynthesisFigure[];
};

/** Écart de SalesScore à partir duquel une équipe se lit comme deux niveaux. */
export const HETEROGENEOUS_GAP = 20;

/**
 * La suggestion de la période, par bloc en retrait.
 *
 * Une phrase par bloc de la grille de découverte, écrite comme un manager
 * l'annoncerait à son équipe : un geste, et l'effet attendu.
 */
const SUGGESTION_BY_BLOCK: Readonly<Record<string, string>> = {
  A: "Ouvrir chaque rendez-vous par trois questions sur l'entreprise elle-même, taille, organisation et existant, avant de parler du besoin. L'effet attendu est une découverte qui commence par le terrain du prospect, pas par le nôtre.",
  B: "Ne pas quitter le besoin tant que le prospect n'a pas donné un exemple vécu et un coût : « qu'est-ce que ça vous coûte aujourd'hui, en temps ou en argent ? ». L'effet attendu est une proposition qui parle de son problème avec ses chiffres.",
  C: "Poser la question de la fourchette budgétaire et du circuit de décision avant la trentième minute, en annonçant d'abord une fourchette de notre côté. L'effet attendu est une proposition mieux cadrée dès le premier envoi.",
  D: "Terminer chaque rendez-vous agenda ouvert, avec une date posée et une action prise par le prospect lui-même. L'effet attendu est une suite qui ne dépend plus de l'e-mail de relance.",
  E: "Laisser un silence après chaque question ouverte et reformuler avant de proposer. L'effet attendu est un prospect qui parle plus que le commercial, et des informations qui sortent d'elles-mêmes.",
};

const enumerate = (items: readonly string[]): string =>
  items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;

export function teamWrittenSynthesis(
  input: TeamWrittenSynthesisInput,
): TeamWrittenSynthesis | null {
  const engagementKey = input.engagementBlockKey ?? "D";
  const scored = input.sellers
    .filter(
      (s): s is SynthesisSeller & { salesScore: number } =>
        s.salesScore != null,
    )
    .sort((a, b) => b.salesScore - a.salesScore);
  if (input.analyzedMeetings === 0 || scored.length === 0) return null;

  const paragraphs: SynthesisParagraph[] = [];
  const figures: SynthesisFigure[] = [];

  /* L'équipe : groupée ou coupée en deux. */
  const best = scored[0]!;
  const worst = scored[scored.length - 1]!;
  if (scored.length >= 2) {
    const gap = best.salesScore - worst.salesScore;
    const heterogeneous = gap >= HETEROGENEOUS_GAP;
    const high = scored.filter(
      (s) => s.salesScore >= worst.salesScore + HETEROGENEOUS_GAP / 2,
    );
    const low = scored.filter((s) => !high.includes(s));
    paragraphs.push({
      title: heterogeneous ? "Une équipe hétérogène." : "Une équipe groupée.",
      text: heterogeneous
        ? `Sur les ${input.analyzedMeetings} rendez-vous analysés, les SalesScores vont de ${worst.salesScore} (${worst.shortName}) à ${best.salesScore} (${best.shortName}). Deux niveaux cohabitent : ${enumerate(high.map((s) => s.shortName))} ${high.length > 1 ? "tiennent" : "tient"} le haut, ${enumerate(low.map((s) => s.shortName))} ${low.length > 1 ? "sont" : "est"} en construction. C'est cette complémentarité qui est à travailler : les premiers ont un geste à transmettre, les seconds un geste à acquérir.`
        : `Sur les ${input.analyzedMeetings} rendez-vous analysés, les SalesScores vont de ${worst.salesScore} (${worst.shortName}) à ${best.salesScore} (${best.shortName}) : ${gap} ${gap >= 2 ? "points" : "point"} d'écart. L'équipe avance groupée, et ce qui manque à l'un manque à tous : c'est un sujet d'atelier collectif plutôt que de coaching individuel.`,
    });
  } else {
    paragraphs.push({
      title: "Une lecture encore individuelle.",
      text: `${best.shortName} porte seul${best.scoredMeetings > 1 ? "" : ""} les ${input.analyzedMeetings} rendez-vous analysés de la période, à ${best.salesScore} sur 100. La synthèse d'équipe prendra son sens quand d'autres rendez-vous seront analysés.`,
    });
  }

  /* Le point commun : les deux critères qui manquent le plus souvent. */
  const [c1, c2] = input.criterionShares;
  if (c1 && input.scorecards > 0) {
    const second = c2
      ? `, et dans ${c2.lowSharePct} % ${c2.label.toLowerCase()} reste absent (critère ${c2.key})`
      : "";
    paragraphs.push({
      title: "Le point commun.",
      text: `Sur les ${input.scorecards} rendez-vous notés, ${c1.label.toLowerCase()} manque dans ${c1.lowSharePct} % des cas (critère ${c1.key})${second}. Ce manque revient chez tout le monde : c'est là que la moyenne se perd, pas sur un commercial en particulier.`,
    });
    figures.push({
      label: `Rendez-vous sans ${c1.label.toLowerCase()} (${c1.key})`,
      value: `${c1.lowSharePct} %`,
    });
    if (c2) {
      figures.push({
        label: `Rendez-vous sans ${c2.label.toLowerCase()} (${c2.key})`,
        value: `${c2.lowSharePct} %`,
      });
    }
  }

  /* Une bonne pratique à faire partager : la suite datée. */
  const engaged = input.sellers
    .filter(
      (s): s is SynthesisSeller & { engagementPct: number } =>
        s.engagementPct != null,
    )
    .sort((a, b) => b.engagementPct - a.engagementPct);
  const engagementBlock = input.blockAverages.find(
    (b) => b.key === engagementKey,
  );
  if (engaged.length >= 2 && engagementBlock) {
    const top = engaged[0]!;
    const bottom = engaged[engaged.length - 1]!;
    paragraphs.push({
      title: "Une bonne pratique à faire partager.",
      text: `${top.shortName} verrouille la suite en séance : ${top.engagementPct} % sur le bloc « ${engagementBlock.name} », contre ${engagementBlock.avgPercent} % pour l'équipe. Ce n'est pas un classement : c'est un geste à lui faire raconter au prochain point d'équipe, pour que ${bottom.shortName} (${bottom.engagementPct} %) s'en empare.`,
    });
    figures.push(
      {
        label: `${engagementBlock.name}, ${top.shortName}`,
        value: `${top.engagementPct} %`,
      },
      {
        label: `${engagementBlock.name}, équipe`,
        value: `${engagementBlock.avgPercent} %`,
      },
      {
        label: `${engagementBlock.name}, ${bottom.shortName}`,
        value: `${bottom.engagementPct} %`,
      },
    );
  }

  /* La suggestion de la période, tirée du bloc le plus en retrait. */
  const weakest = input.blockAverages[0];
  if (weakest) {
    const suggestion =
      SUGGESTION_BY_BLOCK[weakest.key] ??
      `Travailler le bloc « ${weakest.name} » en atelier, avec un rendez-vous réel de la période comme support.`;
    paragraphs.push({
      title: "Notre suggestion pour la période.",
      text: `Le bloc « ${weakest.name} » est à ${weakest.avgPercent} % en moyenne, le plus bas de la grille. ${suggestion}`,
    });
  }

  return { paragraphs, figures };
}
