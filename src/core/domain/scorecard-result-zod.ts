import { z } from "zod";
import { SCORECARD_LEVEL_MAX, SCORECARD_TOTAL } from "./scorecard-grid";

/**
 * Le contrat de sortie d'une scorecard de rendez-vous.
 *
 * Trois schémas, parce que trois mains touchent à une note.
 *
 * Le modèle fait un relevé, critère par critère : ce que le commercial a
 * cherché à savoir (`explored`), ce qu'il a obtenu (`obtained`), en une phrase
 * chacun, avec les mots du transcript. Il ne donne aucun niveau : la revue du
 * 5 octobre a montré qu'un même transcript recevait 38 puis 22, parce qu'un
 * niveau de 0 à 4 se décidait d'un bloc et au jugé.
 *
 * Le produit vérifie les citations, en déduit le niveau par une table fixe
 * (`scorecardLevelFromCoverage`), puis additionne les points. Il enregistre
 * enfin le relevé, le niveau et le score.
 */

/** Ce que le commercial a fait du thème. */
export const SCORECARD_EXPLORED = ["non", "aborde", "creuse"] as const;
/** Ce qu'il en a obtenu. */
export const SCORECARD_OBTAINED = ["rien", "partiel", "exploitable"] as const;

export type ScorecardExplored = (typeof SCORECARD_EXPLORED)[number];
export type ScorecardObtained = (typeof SCORECARD_OBTAINED)[number];

/** Une citation et la personne qui l'a dite. */
export const scorecardProofSchema = z.object({
  who: z.enum(["commercial", "prospect"]),
  quote: z.string().min(1).max(400),
});

/** Le relevé d'un critère, tel que le modèle le rend. */
export const scorecardObservationSchema = z.object({
  /** Clé du critère dans la grille : « A1 », « B3 ». */
  key: z.string().min(1).max(4),
  explored: z.enum(SCORECARD_EXPLORED),
  obtained: z.enum(SCORECARD_OBTAINED),
  /** Ce que le commercial sait maintenant sur ce thème, avec les faits. */
  learned: z.string().max(500),
  /** Ce qui manque pour atteindre le niveau 4. */
  missing: z.string().max(500),
  evidence: z.array(scorecardProofSchema).max(3),
  /**
   * Faux quand le transcript ne montre pas le moment jugé (l'ouverture n'a
   * pas été enregistrée). Depuis le lot 92, le produit n'en tient plus
   * compte : c'est lui qui constate l'ouverture manquante, jamais le modèle.
   * Le champ reste demandé pour que le format ne change pas.
   */
  observable: z.boolean(),
});

/** Un critère noté, tel que le produit l'enregistre. */
export const scorecardCriterionSchema = z.object({
  key: z.string().min(1).max(4),
  /** Calculé par le produit depuis le relevé ; écrit par le modèle avant octobre 2026. */
  level: z.number().int().min(0).max(SCORECARD_LEVEL_MAX),
  /** Extraits retrouvés dans le transcript. */
  evidence: z.array(z.string()).max(3),
  explored: z.enum(SCORECARD_EXPLORED).optional(),
  obtained: z.enum(SCORECARD_OBTAINED).optional(),
  learned: z.string().max(500).optional(),
  missing: z.string().max(500).optional(),
  /** Vrai quand le relevé annonçait plus, mais qu'aucune citation n'a été retrouvée : le niveau est resté à 1. */
  unproven: z.boolean().optional(),
  /** Vrai quand le moment jugé n'est pas dans le transcript : le critère ne compte pas. */
  unobservable: z.boolean().optional(),
  /** Pourquoi le produit a plafonné le niveau, quand il l'a fait. */
  capped: z.string().max(400).optional(),
});

/** Un point perdu prioritaire : le manque, et la phrase qui le comblait. */
export const scorecardPointLostSchema = z.object({
  key: z.string().min(1).max(4),
  /** Ce que le transcript montre à cet endroit, cité ou constaté. */
  evidence: z.string().min(1).max(600),
  /** La formulation exacte que le commercial aurait dû employer, en français. */
  whatToSayInstead: z.string().min(1).max(600),
});

/**
 * Ce que la grille produit en plus du relevé : où gagner des points, et une
 * synthèse de la note.
 *
 * Le coaching (à garder, à améliorer, à arrêter, question en or, défi) n'en
 * fait plus partie depuis le 5 octobre 2026 : la grille et KISS l'écrivaient
 * chacun de leur côté, et la fiche affichait deux conseils qui se
 * contredisaient. Il appartient désormais à KISS seul.
 */
const scorecardCoachingFields = {
  pointsLost: z.array(scorecardPointLostSchema).max(8),
  summary: z.string().min(1).max(4000),
};

/**
 * Le coaching que la grille écrivait avant octobre 2026, gardé en lecture
 * pour les analyses déjà enregistrées.
 */
const scorecardLegacyCoachingFields = {
  keep: z.array(z.string()).max(8).optional(),
  improve: z.array(z.string()).max(8).optional(),
  stop: z.array(z.string()).max(8).optional(),
  goldenQuestion: z.string().max(500).optional(),
  challenge: z.string().max(500).optional(),
};

/**
 * Ce que le modèle doit produire : un relevé par critère, les points perdus
 * et la synthèse.
 *
 * Ni niveau, ni total, ni palier : le produit les déduit du relevé.
 */
export const scorecardGeneratedResultSchema = z.object({
  criteria: z.array(scorecardObservationSchema).max(40),
  ...scorecardCoachingFields,
});

/**
 * Comment le commercial a été reconnu dans le transcript, et donc ce que la
 * note a pu mesurer : reconnu (rôle écrit, nom connu, organisateur), deviné
 * (ordre de parole, questions), ou aucun intervenant distingué.
 *
 * Quand il n'est que deviné ou absent, le côté des citations, l'écoute, les
 * questions et les plafonds ne s'appliquent pas : une inversion des rôles
 * retournerait toute la note. La fiche le dit.
 */
export const SCORECARD_SPEAKERS = ["recognized", "guessed", "none"] as const;
export type ScorecardSpeakers = (typeof SCORECARD_SPEAKERS)[number];

/** Le résultat une fois les niveaux posés par le produit, avant le score. */
export const scorecardLeveledResultSchema = z.object({
  criteria: z.array(scorecardCriterionSchema).max(40),
  ...scorecardCoachingFields,
  ...scorecardLegacyCoachingFields,
  /** Absent sur les analyses d'avant le lot 92. */
  speakers: z.enum(SCORECARD_SPEAKERS).optional(),
});

/** Le score d'un bloc, tel que le produit l'a calculé et enregistré. */
export const scorecardBlockScoreSchema = z.object({
  key: z.string().min(1).max(4),
  name: z.string().min(1).max(120),
  score: z.number().int().min(0).max(SCORECARD_TOTAL),
  max: z.number().int().min(1).max(SCORECARD_TOTAL),
});

/**
 * Ce que le produit enregistre et relit.
 *
 * La grille employée est écrite dans la ligne. Une analyse vieille de six mois
 * doit rester lisible telle qu'elle a été produite, même si la grille a depuis
 * gagné un critère : sans cet identifiant, la fiche rejouerait les anciens
 * niveaux dans la grille du jour et afficherait un score que personne n'a
 * jamais obtenu.
 */
export const scorecardResultSchema = scorecardLeveledResultSchema.extend({
  gridId: z.string().min(1).max(40),
  gridName: z.string().min(1).max(120),
  overallScore: z.number().int().min(0).max(SCORECARD_TOTAL),
  blocks: z.array(scorecardBlockScoreSchema).max(12),
});

export type ScorecardProof = z.infer<typeof scorecardProofSchema>;
export type ScorecardObservation = z.infer<typeof scorecardObservationSchema>;
export type ScorecardCriterionResult = z.infer<typeof scorecardCriterionSchema>;
export type ScorecardPointLost = z.infer<typeof scorecardPointLostSchema>;
export type ScorecardGeneratedResult = z.infer<
  typeof scorecardGeneratedResultSchema
>;
export type ScorecardLeveledResult = z.infer<
  typeof scorecardLeveledResultSchema
>;
export type ScorecardAnalysisResult = z.infer<typeof scorecardResultSchema>;

/** Le relevé d'un critère sans sa clé : la clé est le nom du champ. */
const scorecardObservationBodySchema = scorecardObservationSchema.omit({
  key: true,
});

/**
 * Le format imposé au modèle pour une grille donnée : un champ obligatoire
 * par critère, dans l'ordre de la grille.
 *
 * Avec une simple liste, le modèle rendait 8 critères sur 25 sur un
 * transcript d'une heure, et les 17 autres comptaient 0 (essai du
 * 5 octobre 2026 : 15 sur 100). Un champ par critère ne peut pas être omis.
 */
export function scorecardGeneratedSchemaForGrid(keys: readonly string[]) {
  return z.object({
    criteria: z.object(
      Object.fromEntries(
        keys.map((key) => [key, scorecardObservationBodySchema]),
      ),
    ),
    ...scorecardCoachingFields,
  });
}

/** Le relevé par champ, remis en liste. */
export function scorecardObservationsFromFields(
  fields: Record<string, z.infer<typeof scorecardObservationBodySchema>>,
  keys: readonly string[],
): ScorecardObservation[] {
  return keys
    .filter((key) => fields[key] != null)
    .map((key) => ({ key, ...fields[key] }));
}
