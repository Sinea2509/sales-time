import { z } from "zod";
import { SCORECARD_LEVEL_MAX, SCORECARD_TOTAL } from "./scorecard-grid";

/**
 * Le contrat de sortie d'une scorecard de rendez-vous.
 *
 * Deux schémas, comme pour KISS, mais la frontière ne passe pas au même
 * endroit. Le premier décrit ce que le modèle a le droit de produire : des
 * niveaux et des preuves, jamais un total. Le second décrit ce que le produit
 * enregistre et relit : les niveaux du modèle, plus les scores que le produit a
 * calculés lui-même. Un chiffre qui n'apparaît pas dans le premier schéma est
 * un chiffre que le modèle ne peut pas se tromper en écrivant.
 */

/** Un critère noté : la clé de la grille, le niveau, et de quoi le prouver. */
export const scorecardCriterionSchema = z.object({
  /** Clé du critère dans la grille : « A1 », « B3 ». */
  key: z.string().min(1).max(4),
  level: z.number().int().min(0).max(SCORECARD_LEVEL_MAX),
  /** Extraits recopiés du transcript. Vide quand le niveau est 0. */
  evidence: z.array(z.string()).max(3),
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
 * Ce que le modèle doit produire.
 *
 * Ni `overallScore`, ni sous-total de bloc, ni palier. Le score se déduit des
 * niveaux par une addition que le produit fait lui-même, et le palier se déduit
 * du score par la règle qui décide déjà de tous les paliers affichés. Laisser
 * le modèle nommer son palier aurait installé un cinquième vocabulaire à côté
 * des quatre paliers du produit, et deux mots différents auraient fini par
 * désigner le même rendez-vous sur le même écran.
 */
export const scorecardGeneratedResultSchema = z.object({
  criteria: z.array(scorecardCriterionSchema).max(40),
  pointsLost: z.array(scorecardPointLostSchema).max(8),
  keep: z.array(z.string()).max(8),
  improve: z.array(z.string()).max(8),
  stop: z.array(z.string()).max(8),
  goldenQuestion: z.string().min(1).max(500),
  challenge: z.string().min(1).max(500),
  summary: z.string().min(1).max(4000),
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
export const scorecardResultSchema = scorecardGeneratedResultSchema.extend({
  gridId: z.string().min(1).max(40),
  gridName: z.string().min(1).max(120),
  overallScore: z.number().int().min(0).max(SCORECARD_TOTAL),
  blocks: z.array(scorecardBlockScoreSchema).max(12),
});

export type ScorecardCriterionResult = z.infer<typeof scorecardCriterionSchema>;
export type ScorecardPointLost = z.infer<typeof scorecardPointLostSchema>;
export type ScorecardGeneratedResult = z.infer<
  typeof scorecardGeneratedResultSchema
>;
export type ScorecardAnalysisResult = z.infer<typeof scorecardResultSchema>;
