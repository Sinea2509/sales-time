import { z } from "zod";

/**
 * Le briefing d'un prochain rendez-vous, tel que la maquette du 11 septembre
 * le lit : ce qu'on sait déjà, le profil pressenti, ce qui reste à obtenir,
 * les cinq questions à poser, l'objectif de sortie et le piège à éviter.
 *
 * `exitGoal` et `trapToAvoid` sont écrits en français, prêts à être lus tels
 * quels : la carte de droite les pose sans les reformuler.
 */
export const meetingBriefingSchema = z.object({
  lastMeetingSummary: z.string(),
  discDominant: z.string().nullable(),
  soncasDominant: z.string().nullable(),
  startActions: z.array(z.string()).max(8),
  customQuestions: z.array(z.string()).max(8),
  openPoints: z.array(z.string()).max(8),
  stageAdvice: z.string(),
  genericAdvice: z.boolean(),
  /** Ce avec quoi il faut repartir : une date, un chiffre, un nom. */
  exitGoal: z.string().max(600),
  /** Le geste qui ferait perdre le rendez-vous, et pourquoi. */
  trapToAvoid: z.string().max(600),
});

export type MeetingBriefingResult = z.infer<typeof meetingBriefingSchema>;
