import { z } from "zod";

/**
 * Le contrat de sortie de l'analyse des objections.
 *
 * Une objection est une phrase du prospect qui freine, doute ou pose une
 * condition. Pour chacune, le modèle rend quatre choses : la phrase telle
 * qu'elle a été dite, ce que le commercial a répondu sur le moment, l'effet
 * que cette réponse a produit, et une suggestion pour la suite. La suggestion
 * contient toujours une question à poser au prospect, parce que c'est la
 * question qui fait avancer une objection, pas l'argument qu'on lui oppose.
 *
 * L'effet est aussi rendu sous forme d'un état à trois valeurs, pour que la
 * fiche puisse compter ce qui reste ouvert sans relire le texte.
 */
export const OBJECTION_OUTCOMES = ["handled", "partial", "open"] as const;
export type ObjectionOutcome = (typeof OBJECTION_OUTCOMES)[number];

export const OBJECTIONS_MAX = 8;

export const objectionSchema = z.object({
  /** La phrase du prospect, recopiée depuis le transcript. */
  objection: z.string().min(1).max(500),
  /** Qui l'a dite, tel que le transcript le nomme : « Le prospect », « H. Vasseur ». */
  who: z.string().min(1).max(80),
  /** Le repère dans l'échange, quand le transcript en porte un : « 14'30 », « vers le milieu ». */
  moment: z.string().max(40).nullable(),
  /** Ce que le commercial a répondu sur le moment, cité ou constaté. */
  response: z.string().min(1).max(600),
  /** L'effet obtenu, en une ou deux phrases. */
  effect: z.string().min(1).max(600),
  outcome: z.enum(OBJECTION_OUTCOMES),
  /** Ce que nous suggérons pour la suite, avec une question à poser, en français. */
  suggestion: z.string().min(1).max(800),
});

export const objectionsResultSchema = z.object({
  objections: z.array(objectionSchema).max(OBJECTIONS_MAX),
  /**
   * Deux à trois phrases sur la façon dont les objections ont été reçues
   * dans ce rendez-vous. Vide quand aucune objection n'a été relevée : la
   * fiche dit alors elle-même ce que cette absence signifie.
   */
  summary: z.string().max(1500),
});

export type ObjectionResult = z.infer<typeof objectionSchema>;
export type ObjectionsAnalysisResult = z.infer<typeof objectionsResultSchema>;
