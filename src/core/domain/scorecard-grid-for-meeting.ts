import {
  DEFAULT_SCORECARD_GRID,
  scorecardGridById,
  type ScorecardGrid,
  type ScorecardGridId,
} from "./scorecard-grid";

/**
 * Quelle grille appliquer à un rendez-vous, d'après son type.
 *
 * Le type de rendez-vous est du texte libre, choisi par chaque organisation
 * dans ses réglages. Le produit est vendu à des maisons qui n'appellent pas les
 * mêmes choses des mêmes noms, et la liste livrée par défaut n'est qu'une
 * suggestion qu'elles réécrivent. Enfermer la scorecard dans une énumération
 * figée aurait donc réservé la fonction à celles qui n'ont rien renommé.
 *
 * La reconnaissance se fait sur des mots, accents et ponctuation retirés, en
 * cherchant une suite de mots entière : « Découverte », « RDV découverte
 * client » et « discovery call » désignent la même grille, « Redécouverte » ne
 * la désigne pas. La correspondance entre un type et une grille deviendra un
 * réglage d'organisation ; ce fichier est l'endroit qui en tiendra la valeur
 * par défaut.
 */

const MARQUES_DIACRITIQUES = /\p{M}/gu;
const PONCTUATION = /[^a-z0-9]+/g;

/** « RDV de Découverte ! » devient « rdv de decouverte ». */
export function normalizeMeetingLabel(raw: string | null | undefined): string {
  return (raw ?? "")
    .normalize("NFD")
    .replace(MARQUES_DIACRITIQUES, "")
    .toLowerCase()
    .replace(PONCTUATION, " ")
    .trim();
}

/**
 * Les libellés qui désignent chaque grille.
 *
 * Le français et l'anglais, parce que les équipes commerciales mélangent les
 * deux dans leurs libellés de CRM. « Qualification » mène à la découverte :
 * c'est le même travail sous un autre nom, et la liste livrée par défaut
 * propose les deux.
 */
const LIBELLES_DE_GRILLE: readonly {
  readonly gridId: ScorecardGridId;
  readonly libelles: readonly string[];
}[] = [
  {
    gridId: "DECOUVERTE",
    libelles: [
      "decouverte",
      "discovery",
      "qualification",
      "exploration",
      "premier rdv",
      "premier rendez vous",
      "first meeting",
      "r1",
    ],
  },
];

/**
 * La grille dont un des libellés apparaît dans ce texte déjà normalisé.
 *
 * Le texte est entouré d'espaces et le libellé cherché aussi, si bien que la
 * recherche porte sur une suite de mots entière et non sur un fragment. Un
 * texte vide ne trouve rien, sans qu'il faille l'écrire : « decouverte » ne se
 * rencontre pas dans deux espaces.
 */
function grilleDuLibelle(normalise: string): ScorecardGrid | null {
  const entoure = ` ${normalise} `;
  for (const entree of LIBELLES_DE_GRILLE) {
    for (const libelle of entree.libelles) {
      if (entoure.includes(` ${libelle} `)) {
        return scorecardGridById(entree.gridId);
      }
    }
  }
  return null;
}

/**
 * La grille du rendez-vous, ou `null` s'il n'y en a pas pour ce type.
 *
 * Un rendez-vous sans type ni étape reçoit la grille par défaut : rien ne dit
 * que ce n'est pas une découverte, et c'en est une la plupart du temps. La
 * fiche affiche le nom de la grille appliquée, si bien que le pari se voit.
 *
 * Un rendez-vous dont le type ne correspond à aucune grille n'est pas noté du
 * tout. Passer un closing dans la grille de découverte lui reprocherait de
 * n'avoir pas fait le travail d'un premier rendez-vous, avec un score bas à
 * l'appui, et ce score irait ensuite grossir des moyennes. Tant que la grille
 * de closing n'existe pas, l'absence de note est la seule réponse vraie.
 *
 * Le type l'emporte sur l'étape du pipeline, et l'étape n'est lue que si le
 * type est vide, exactement comme le fait le libellé affiché sur la fiche. Un
 * rendez-vous typé « Démo » reste une démo même si l'affaire est encore rangée
 * à l'étape « Lead entrant ».
 *
 * L'étape est un signal faible et elle est traitée comme tel : elle qualifie
 * l'affaire, pas la séance. Les étapes livrées par défaut le montrent bien,
 * « Qualifié » disant qu'une qualification a eu lieu et non que ce rendez-vous
 * en était une ; aucune d'elles ne désigne donc de grille. Une organisation
 * dont les étapes s'appellent « Découverte » ou « Discovery » sera reconnue,
 * les autres attendront que leurs rendez-vous portent un type.
 */
export function scorecardGridForMeeting(source: {
  meetingType?: string | null;
  pipelineStage?: string | null;
}): ScorecardGrid | null {
  const libelle =
    normalizeMeetingLabel(source.meetingType) ||
    normalizeMeetingLabel(source.pipelineStage);

  if (!libelle) return DEFAULT_SCORECARD_GRID;
  return grilleDuLibelle(libelle);
}
