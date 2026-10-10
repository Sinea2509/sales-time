import { plurielFr } from "@/lib/pluriel-fr";
import {
  coachingScoreBands,
  COACHING_SCORE_MAX,
} from "@/src/core/domain/coaching-score-scale";
import { PROFILE_SCORE_BANDS } from "@/src/core/domain/profile-score-scale";
import { PROFILE_SCORE_BY_POINTS } from "@/src/core/domain/profile-moments";
import { libelleTranche, scoreBands } from "@/src/core/domain/score-bands";
import {
  SCORECARD_EXPLORED_LABEL,
  SCORECARD_OBTAINED_LABEL,
  scorecardLevelFromCoverage,
} from "@/src/core/domain/scorecard-coverage";
import {
  DEFAULT_SCORECARD_GRID,
  SCORECARD_LEVEL_MAX,
  SCORECARD_TOTAL,
  scorecardCriteria,
} from "@/src/core/domain/scorecard-grid";
import {
  SCORECARD_EXPLORED,
  SCORECARD_OBTAINED,
} from "@/src/core/domain/scorecard-result-zod";
import {
  listeningLevelFromTalkShare,
  TALK_SHARE_CEILING_PCT,
} from "@/src/core/domain/talk-share-from-transcript";
import type { AnalysisKindSlug } from "@/src/core/ports/prompt-template-repository-port";

/**
 * Ce que fait une analyse, comment elle note, et ce qu'elle laisse aux autres.
 *
 * La revue du 5 octobre 2026 l'a demandé : en lisant les consignes, on ne
 * voyait pas le système de notation, et des consignes se recouvraient (la
 * grille et KISS écrivaient chacune leur coaching, le compte rendu et
 * l'analyse des objections relevaient chacun leurs objections). Chaque
 * analyse a désormais un rôle, et cette fiche le dit.
 *
 * Tout ce qui est chiffré se lit dans les constantes du produit, jamais
 * recopié : la fiche ne peut pas dire autre chose que ce que le calcul fait.
 */
export type ScoringTable = {
  readonly caption: string;
  readonly head: readonly string[];
  readonly rows: readonly (readonly string[])[];
};

export type AnalysisScoringOverview = {
  /** Ce que l'analyse apporte, en une phrase. */
  readonly role: string;
  /** Ce qu'elle produit, élément par élément. */
  readonly produces: readonly string[];
  /** Comment elle note, en phrases. Vide pour une analyse qui ne note pas. */
  readonly scoring: readonly string[];
  readonly tables: readonly ScoringTable[];
  /** Ce qu'elle ne fait pas, et l'analyse qui s'en charge. */
  readonly notHere: readonly string[];
};

const PROFILE_BAND_FR: Record<string, string> = {
  absent: "rien à citer dans le transcript",
  faint: "un signe isolé, ou ambigu",
  clear: "net, au moins une fois, dans les mots du prospect",
  marked: "revient à plusieurs moments du rendez-vous",
  pervasive: "traverse tout le rendez-vous",
};

function profileBandsTable(caption: string): ScoringTable {
  return {
    caption,
    head: ["Note", "Ce qu'il faut avoir entendu"],
    rows: PROFILE_SCORE_BANDS.map((b) => [
      `${b.min} à ${b.max}`,
      PROFILE_BAND_FR[b.nom] ?? b.nom,
    ]),
  };
}

function momentPointsTable(caption: string): ScoringTable {
  return {
    caption,
    head: ["Points des passages", "Note sur 100"],
    rows: PROFILE_SCORE_BY_POINTS.map((score, points) => [
      points === PROFILE_SCORE_BY_POINTS.length - 1
        ? `${points} et plus`
        : String(points),
      String(score),
    ]),
  };
}

function tiersTable(): ScoringTable {
  return {
    caption: "Le palier affiché au commercial",
    head: ["SalesScore", "Palier"],
    rows: scoreBands({ max: SCORECARD_TOTAL, pointsParUnite: 1 }).map((b) => [
      libelleTranche(b),
      b.tier.nom,
    ]),
  };
}

function scorecardOverview(): AnalysisScoringOverview {
  const grid = DEFAULT_SCORECARD_GRID;
  const criteria = scorecardCriteria(grid);
  return {
    role: "La grille donne le SalesScore du commercial sur 100 : c'est la seule note de sa performance sur le rendez-vous.",
    produces: [
      "Le SalesScore sur 100, et le score de chaque bloc.",
      "Pour chaque critère : ce qui a été obtenu, ce qui manque, et les citations.",
      "« Où gagner des points » : 3 à 5 critères avec la phrase à dire la prochaine fois.",
      "Une synthèse de 3 à 5 phrases qui explique la note.",
    ],
    scoring: [
      `${criteria.length} critères en ${grid.blocks.length} blocs. Chaque critère vaut de 0 à ${SCORECARD_LEVEL_MAX} points, et les points s'additionnent jusqu'à ${SCORECARD_TOTAL}.`,
      "L'IA ne donne aucune note. Elle relève, pour chaque critère, ce que le commercial a fait du thème et ce qu'il a obtenu. Le produit en tire le niveau par la table ci-dessous, toujours de la même façon.",
      "Le thème compte, pas la formulation : une question posée avec d'autres mots que les exemples compte pleinement.",
      `Chaque citation est retrouvée dans le transcript, avec la personne qui l'a dite : trois mots au moins, les nombres exacts, et une même citation ne sert qu'à un critère. Une citation introuvable est retirée ; un critère sans aucune citation ne dépasse pas 1 point.`,
      "Les citations ne peuvent que faire baisser le relevé, jamais le monter : un thème « creusé » sans relance visible (la question du commercial et la réponse du prospect, ou deux paroles du commercial) redescend à « abordé » ; une information « exploitable » sans rien de précis dans les mots du prospect (un nombre, une date ou une échéance, un nom) redescend à « partielle » ; une information sans parole du prospect retrouvée baisse d'un cran. Une citation tirée des notes du commercial ne vaut pas une parole du prospect. Deux modèles qui citent les mêmes passages reçoivent donc la même note.",
      "Le produit reconnaît le commercial dans le transcript à son rôle écrit (« Commercial : »), à son nom, ou parce qu'il a lancé la transcription. Quand il n'est que deviné, à l'ordre de parole ou aux questions, le côté des citations, l'écoute, les questions et les plafonds ne s'appliquent pas, et la fiche le dit : une inversion des rôles retournerait toute la note.",
      "Le cadrage (E4) sort du calcul quand le produit constate que le transcript commence sans l'ouverture : le prospect parle en premier, sans salutation. L'IA ne décide pas de cela.",
      `L'écoute (E1) est mesurée sur la répartition de la parole : ${[
        40, 50, 60, 61,
      ]
        .map(
          (pct, i) =>
            `${i < 3 ? `jusqu'à ${pct} %` : `au-delà de 60 %`} : ${listeningLevelFromTalkShare(pct)} ${plurielFr(listeningLevelFromTalkShare(pct), "point")}`,
        )
        .join(
          " ; ",
        )}. Plafond conseillé : ${TALK_SHARE_CEILING_PCT} % pour le commercial.`,
      "Le questionnement (E2) est mesuré sur les questions du commercial, rangées en ouvertes, fermées et de simple vérification : 4 points avec au moins 55 % de questions ouvertes et au moins huit d'entre elles, 3 points à partir de 40 %, sinon 2 points, et 0 sans aucune question.",
      "La personnalisation (E3) ne dépasse pas 2 points quand le commercial déroule plus de 250 mots d'affilée dans le premier tiers du rendez-vous.",
      "Le même transcript, avec la même consigne et le même modèle, reçoit la même note.",
      "Un rendez-vous sans grille (un type autre que la découverte) n'est pas noté : il n'entre ni dans la moyenne ni dans le classement.",
      "Pour une bonne note : couvrir les cinq blocs ; relancer chaque réponse vague jusqu'à obtenir un nom, un chiffre, une date ou un exemple ; repartir avec une date ferme et un engagement du prospect ; parler moins de 40 % du temps. Le tableau « Critère par critère » donne, pour chacun, ce qu'il faut obtenir et des questions qui y mènent.",
    ],
    tables: [
      {
        caption: "Le niveau d'un critère, selon le relevé",
        head: [
          "Ce qui a été obtenu",
          ...SCORECARD_EXPLORED.map((e) => SCORECARD_EXPLORED_LABEL[e]),
        ],
        rows: SCORECARD_OBTAINED.map((o) => [
          SCORECARD_OBTAINED_LABEL[o],
          ...SCORECARD_EXPLORED.map((e) =>
            String(scorecardLevelFromCoverage(e, o)),
          ),
        ]),
      },
      {
        caption: `Les blocs de la grille « ${grid.name} »`,
        head: ["Bloc", "Points", "Critères"],
        rows: grid.blocks.map((b) => [
          `${b.key}. ${b.name}`,
          String(b.weight),
          b.criteria.map((c) => `${c.key} ${c.label}`).join(", "),
        ]),
      },
      {
        caption:
          "Critère par critère : comment avoir 4 points, et les questions qui y mènent",
        head: [
          "Critère",
          "Pour avoir 4 points",
          "Ce qui compte, n'importe où dans le rendez-vous",
          "Questions possibles (d'autres mots comptent aussi)",
        ],
        rows: criteria.map((c) => [
          `${c.key}. ${c.label}`,
          c.expected,
          c.measuredByProduct
            ? `Mesuré par le produit. ${c.lookFor ?? ""}`
            : (c.lookFor ?? ""),
          c.examples?.length
            ? c.examples.map((e) => `« ${e} »`).join(" ")
            : c.measuredByProduct
              ? "Laisser parler le prospect : poser une question courte, puis se taire."
              : "Pas de question type : c'est la façon de mener tout l'échange.",
        ]),
      },
      tiersTable(),
    ],
    notHere: [
      "Le coaching (à garder, à améliorer, à arrêter, question en or, défi) : analyse KISS.",
      "Les objections : analyse des objections.",
      "Le profil du prospect : SONCAS et DISC.",
    ],
  };
}

const OVERVIEWS: Partial<
  Record<AnalysisKindSlug, () => AnalysisScoringOverview>
> = {
  SCORECARD: scorecardOverview,
  KISS: () => ({
    role: "KISS écrit le coaching du commercial, et lui seul : ce qu'il faut garder, améliorer, arrêter et essayer, la question en or et le défi.",
    produces: [
      "Le brief du coach : un paragraphe à relire avant le prochain contact.",
      "Quatre listes : à conserver, à améliorer, à arrêter, à démarrer.",
      "La question en or et le défi du prochain rendez-vous.",
      "Six notes du comportement du commercial (radar « Mon profil de vente ») et une note de conduite du rendez-vous.",
    ],
    scoring: [
      "KISS ne donne pas le SalesScore. Il reçoit le relevé de la grille, le type de rendez-vous et la parole mesurée, et son coaching ne doit pas les contredire.",
      `La note de conduite va de 0 à ${COACHING_SCORE_MAX}. Elle ne remplace pas le SalesScore et n'entre dans aucune moyenne.`,
      "Les six notes du commercial vont de 0 à 100 : assertivité, écoute active, capital sympathie, argumentation, traitement des objections, prochaines étapes. 50 est un rendez-vous ordinaire.",
      `Quand le commercial a parlé plus de ${TALK_SHARE_CEILING_PCT} % du temps, « à arrêter » le dit toujours, avec le chiffre mesuré.`,
    ],
    tables: [
      {
        caption: "La note de conduite et son palier",
        head: ["Note sur 10", "Palier"],
        rows: coachingScoreBands().map((b) => [libelleTranche(b), b.tier.nom]),
      },
    ],
    notHere: [
      "La note du commercial (SalesScore) : la grille.",
      "Les objections : analyse des objections.",
      "Le profil du prospect : SONCAS et DISC.",
    ],
  }),
  SONCAS: () => ({
    role: "SONCAS décrit ce qui motive le prospect à acheter. Il ne note pas le commercial.",
    produces: [
      "3 à 8 passages-clés : la réponse du prospect, la question qui l'a amenée, ce qu'elle révèle.",
      "Six leviers notés sur 100 : sécurité, orgueil, nouveauté, confort, argent, sympathie.",
      "Le levier principal, et comment lui parler.",
    ],
    scoring: [
      "L'IA ne note pas les leviers. Elle relève les passages-clés : les réponses du prospect sur ce qui est important pour lui, ce qu'il attend d'un prestataire, ce qui l'a déçu, sa réaction au prix, ses conditions, ses objections. Le reste du rendez-vous est ignoré.",
      "Chaque passage est recherché mot pour mot dans les paroles du prospect ; un passage introuvable, ou dit par le commercial, est écarté.",
      "Le produit compte deux points par passage net et un par passage faible, puis lit la note du levier dans le tableau ci-dessous.",
    ],
    tables: [
      momentPointsTable("La note d'un levier, selon ses passages"),
      profileBandsTable("Ce que veut dire la note"),
    ],
    notHere: [
      "La note du commercial : la grille.",
      "Le style de communication du prospect : DISC.",
    ],
  }),
  DISC: () => ({
    role: "DISC décrit la façon dont le prospect communique dans ce rendez-vous. Ce n'est pas un test de personnalité, et il ne note pas le commercial.",
    produces: [
      "3 à 8 passages-clés : les mots du prospect et la façon dont il les dit.",
      "Quatre styles notés sur 100, indépendants : dominance, influence, stabilité, conformité.",
      "Le style principal, et comment lui parler.",
    ],
    scoring: [
      "L'IA ne note pas les styles. Elle relève les passages où la façon de réagir du prospect se voit : réponse à une question ouverte, réaction au prix ou à une proposition, objection, initiative, fin du rendez-vous.",
      "Chaque passage est recherché mot pour mot dans les paroles du prospect ; un passage introuvable est écarté.",
      "Le produit compte deux points par passage net et un par passage faible, puis lit la note du style dans le tableau ci-dessous.",
    ],
    tables: [
      momentPointsTable("La note d'un style, selon ses passages"),
      profileBandsTable("Ce que veut dire la note"),
    ],
    notHere: [
      "Ce qui motive le prospect : SONCAS.",
      "La note du commercial : la grille.",
    ],
  }),
  OBJECTIONS: () => ({
    role: "L'analyse des objections relève les réserves du prospect et la façon dont le commercial les a traitées. C'est la seule source des objections, compte rendu compris.",
    produces: [
      "Chaque objection : la phrase du prospect, la réponse du commercial, l'effet, et une question à poser.",
    ],
    scoring: [
      "Pas de note. Chaque objection reçoit un état : levée (le prospect accepte la réponse ou la suite), levée à moitié (une preuve reste à apporter ; en découverte, renvoyer la preuve au rendez-vous suivant après avoir exploré la réserve), ou ouverte.",
      "Une objection retrouvée mot pour mot dans les paroles du prospect s'affiche entre guillemets ; sinon, « En substance ».",
    ],
    tables: [],
    notHere: ["Le coaching : KISS.", "La note du commercial : la grille."],
  }),
  MEETING_DETAIL_SYNTHESIS: () => ({
    role: "Le compte rendu de visite rassemble les faits du rendez-vous pour le CRM. Il ne note rien lui-même.",
    produces: [
      "Les faits : participants, contexte, existant, besoin, décision, prix, prestataires, suite.",
    ],
    scoring: [
      "Pas de note. Il reprend tel quel le SalesScore et la maturité de la grille, le coaching de KISS, les objections de leur analyse et le profil SONCAS et DISC.",
    ],
    tables: [],
    notHere: [
      "La note : la grille.",
      "Le coaching : KISS.",
      "Les objections : analyse des objections.",
    ],
  }),
};

/** La fiche d'une analyse, ou `null` pour celles qui ne notent rien. */
export function analysisScoringOverview(
  kind: AnalysisKindSlug,
): AnalysisScoringOverview | null {
  return OVERVIEWS[kind]?.() ?? null;
}
