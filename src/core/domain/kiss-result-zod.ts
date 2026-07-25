import { z } from "zod";

/**
 * Les six compétences du commercial, notées 0–100 sur un rendez-vous.
 *
 * Ces scores portent sur le VENDEUR, et c'est tout leur intérêt. SONCAS et DISC
 * n'en disent rien : leurs consignes demandent noir sur blanc de décrire le
 * PROSPECT (« Infer the prospect's dominant motivation(s) », « DISC (prospect
 * focus) », « Estimate how the prospect tends to communicate in this meeting
 * (not the seller) »). Le radar « Mon profil de vente » se construisait
 * pourtant en moyennant ces scores prospect, et racontait donc au commercial
 * le portrait de ses clients en lui disant que c'était le sien : devant des
 * acheteurs prudents il lisait « objections bien traitées », devant des
 * acheteurs pressés « assertivité élevée », sans avoir rien changé à sa façon
 * de vendre. KISS est la seule analyse déjà tournée vers le vendeur, donc la
 * seule à pouvoir porter ces six notes.
 */
export const sellerSkillScoresSchema = z.object({
  assertivite: z.number().int().min(0).max(100),
  ecouteActive: z.number().int().min(0).max(100),
  capitalSympathie: z.number().int().min(0).max(100),
  argumentation: z.number().int().min(0).max(100),
  objections: z.number().int().min(0).max(100),
  nextSteps: z.number().int().min(0).max(100),
});

export type SellerSkillScores = z.infer<typeof sellerSkillScoresSchema>;

/** Ce que le modèle doit produire : les six compétences sont obligatoires. */
export const kissGeneratedResultSchema = z.object({
  keep: z.array(z.string()).max(20),
  improve: z.array(z.string()).max(20),
  stop: z.array(z.string()).max(20),
  start: z.array(z.string()).max(20),
  goldenQuestion: z.string().min(1).max(500),
  coachingScore: z.number().int().min(0).max(10),
  coachingScoreJustification: z.string().min(1).max(2000),
  summary: z.string().min(1).max(4000),
  sellerSkills: sellerSkillScoresSchema,
});

/**
 * Ce que le produit accepte en lecture : `sellerSkills` y est facultatif.
 *
 * Aucune analyse enregistrée avant cette version ne le porte. L'exiger ici
 * ferait échouer `safeParse` sur tout l'historique : la fiche RDV, la matrice
 * de qualification et les puces de coaching cesseraient d'afficher des analyses
 * qui existent bel et bien. Seul le profil de vente a besoin du champ, et il
 * sait dire qu'il lui manque plutôt que d'inventer une note.
 */
export const kissResultSchema = kissGeneratedResultSchema.extend({
  sellerSkills: sellerSkillScoresSchema.optional(),
});

export type KissAnalysisResult = z.infer<typeof kissResultSchema>;
