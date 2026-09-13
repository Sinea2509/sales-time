import {
  DEFAULT_MEETING_TYPES,
  DEFAULT_PIPELINE_STAGES,
} from "@/lib/onboarding-defaults";
import {
  ETAPE_NON_RENSEIGNEE,
  meetingEtapeDisplayLabel,
} from "@/src/core/domain/meeting-etape-display";

export type MeetingEtapeSource = {
  meetingType: string | null;
  pipelineStage: string | null;
};

export { ETAPE_NON_RENSEIGNEE, meetingEtapeDisplayLabel };

/*
  Pourquoi une étape ne porte plus de couleur.

  Le code précédent devinait l'étape à partir de mots-clés français
  (« decouverte », « demo », « proposition », « closing », « negociation »,
  « qualif », « absent ») et rangeait le vocabulaire dans cinq styles. Deux
  paires tombaient donc sur la même couleur exacte : Découverte et Démo en
  vert, Proposition et Closing en bleu. Deux étapes différentes, une seule
  couleur, c'est une information fausse. Et une organisation qui écrit ses
  étapes en anglais, en espagnol, ou simplement autrement, n'obtenait aucune
  couleur du tout.

  Avant d'écrire une palette, on a mesuré combien de couleurs on peut
  distinguer, avec le validateur de contraste de la méthode :

  - En palette catégorielle, sur un nuage de points où toutes les paires se
    côtoient, la palette de référence ne tient que TROIS créneaux dans les deux
    modes. Le quatrième met le jaune à côté de l'orange et tombe sous le
    plancher de vision normale.
  - En rampe ordonnée d'une seule teinte, le bleu tient CINQ marches : chaque
    pas de 50 ne vaut que 0,047 de clarté, sous le minimum de 0,06, donc les
    marches doivent être espacées de 100 ; et la plus claire ne dépasse le
    rapport de 2:1 sur un fond blanc qu'à partir de la marche 250. Reste
    250-350-450-550-650, soit cinq.

  Le vocabulaire par défaut compte sept types de rendez-vous, et jusqu'à onze
  en comptant les étapes de pipeline. Trois, cinq, onze : aucune palette
  validée ne distingue le vocabulaire d'étapes. La couleur ne peut donc pas
  porter l'étape, quelle que soit la palette choisie.

  Alors elle ne la porte plus. L'étape est écrite en toutes lettres dans la
  pastille : elle se lit sans couleur. Ce qui reste coloré dans ces écrans est
  ce que la couleur sait dire, c'est-à-dire un état (issue du rendez-vous) et
  une grandeur (SalesScore).

  Une seule distinction subsiste, et ce n'est pas une étape : l'absence
  d'étape. Un rendez-vous sans étape n'est pas rangé quelque part dans le
  vocabulaire, il n'est rangé nulle part, et la pastille le dit par un contour
  en pointillés plutôt que par une teinte de plus.
*/

/** Une étape renseignée : un aplat neutre, qui suit le thème de l'organisation. */
const ETAPE_PILL_CLASS = "border-border bg-muted text-foreground";

/** L'absence d'étape : même pastille, contour ouvert, encre en retrait. */
const ETAPE_ABSENTE_PILL_CLASS =
  "border-border border-dashed bg-transparent text-muted-foreground";

export function meetingEtapePillClassForLabel(label: string): string {
  return label === ETAPE_NON_RENSEIGNEE
    ? ETAPE_ABSENTE_PILL_CLASS
    : ETAPE_PILL_CLASS;
}

export function meetingEtapePillClass(source: MeetingEtapeSource): string {
  return meetingEtapePillClassForLabel(meetingEtapeDisplayLabel(source));
}

/**
 * Le vocabulaire d'étapes de l'organisation, dans son ordre.
 *
 * Les types de rendez-vous d'abord, puis les étapes de pipeline qui n'y
 * figurent pas déjà : c'est l'ordre dans lequel `meetingEtapeDisplayLabel`
 * choisit le libellé d'un rendez-vous, donc l'ordre dans lequel un lecteur les
 * rencontre. Les listes vides retombent sur celles que l'application installe
 * à la création d'une organisation.
 *
 * Cet ordre ne sert qu'à ranger : il ne décide d'aucune couleur, et il ne dit
 * pas qu'une étape en précède une autre dans un cycle de vente. C'est la liste
 * de l'organisation, telle qu'elle l'a écrite.
 */
export function etapeVocabularyFromOptions(options?: {
  meetingTypeOptions?: readonly string[] | null;
  pipelineStageOptions?: readonly string[] | null;
}): string[] {
  const types = options?.meetingTypeOptions?.length
    ? options.meetingTypeOptions
    : DEFAULT_MEETING_TYPES;
  const stages = options?.pipelineStageOptions?.length
    ? options.pipelineStageOptions
    : DEFAULT_PIPELINE_STAGES;

  const ordered: string[] = [];
  const seen = new Set<string>();
  for (const label of [...types, ...stages]) {
    const trimmed = label.trim();
    if (trimmed === "" || seen.has(trimmed)) continue;
    seen.add(trimmed);
    ordered.push(trimmed);
  }
  return ordered;
}

/**
 * Range des libellés d'étape dans l'ordre du vocabulaire de l'organisation.
 *
 * Ce que le vocabulaire ne contient pas passe après, par ordre alphabétique
 * français : une étape saisie autrefois, puis retirée de la liste, garde une
 * place stable au lieu de se promener. L'absence d'étape ferme la marche, quel
 * que soit son rang alphabétique : ce n'est pas une étape parmi les autres.
 */
export function sortEtapesByVocabulary(
  labels: readonly string[],
  vocabulary: readonly string[],
): string[] {
  const rank = new Map<string, number>();
  vocabulary.forEach((label, index) => {
    if (!rank.has(label)) rank.set(label, index);
  });

  const rangOf = (label: string): number => {
    if (label === ETAPE_NON_RENSEIGNEE) return Number.MAX_SAFE_INTEGER;
    return rank.get(label) ?? vocabulary.length;
  };

  return [...labels].sort((a, b) => {
    const ecart = rangOf(a) - rangOf(b);
    if (ecart !== 0) return ecart;
    return a.localeCompare(b, "fr");
  });
}
