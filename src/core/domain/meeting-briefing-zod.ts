import { z } from "zod";

/** Une objection à anticiper, avec la réponse à préparer. */
export const likelyObjectionSchema = z.object({
  /** Ce que le prospect risque de dire. */
  objection: z.string().max(240),
  /** Ce que le commercial peut répondre, relié à ce que le prospect a dit. */
  answer: z.string().max(400),
});

export type LikelyObjection = z.infer<typeof likelyObjectionSchema>;

/**
 * Le briefing du prochain rendez-vous.
 *
 * Il tenait en trois listes de texte. Retour de Thomas du 29 octobre 2026 :
 * « un peu trop léger », « très triste », et « la question en or, on n'a plus
 * ça ? ». D'où l'objectif, la question en or, la façon de parler à
 * l'interlocuteur et les objections à anticiper.
 *
 * Aucun champ facultatif : les formats imposés d'OpenAI les refusent. Ce qui
 * n'a rien à dire rend une chaîne ou une liste vide.
 */
export const meetingBriefingSchema = z.object({
  lastMeetingSummary: z.string(),
  discDominant: z.string().nullable(),
  soncasDominant: z.string().nullable(),
  /** Ce que ce rendez-vous doit obtenir. */
  meetingGoal: z.string().max(400),
  /** La question dont la réponse fait le plus avancer l'affaire. */
  goldenQuestion: z.string().max(400),
  /** Pourquoi cette question-là. */
  goldenQuestionWhy: z.string().max(400),
  /** Comment parler à cet interlocuteur, d'après son profil. */
  howToTalk: z.string().max(600),
  startActions: z.array(z.string()).max(8),
  customQuestions: z.array(z.string()).max(8),
  likelyObjections: z.array(likelyObjectionSchema).max(4),
  openPoints: z.array(z.string()).max(8),
  stageAdvice: z.string(),
  genericAdvice: z.boolean(),
});

export type MeetingBriefingResult = z.infer<typeof meetingBriefingSchema>;
