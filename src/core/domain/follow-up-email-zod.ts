import { z } from "zod";

export const followUpEmailResultSchema = z.object({
  subject: z.string().min(1).max(300),
  greeting: z.string().min(1).max(500),
  painPoints: z.string().min(1).max(4000),
  proposedSolutions: z.string().min(1).max(4000),
  nextSteps: z.string().min(1).max(4000),
  closing: z.string().min(1).max(2000),
});

export type FollowUpEmailResult = z.infer<typeof followUpEmailResultSchema>;

/** Le mail retouché à la demande du commercial : son objet et son corps entier. */
export const followUpEmailRevisionSchema = z.object({
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(8000),
});

export type FollowUpEmailRevision = z.infer<typeof followUpEmailRevisionSchema>;

/**
 * Les retouches proposées en un clic sous le mail, pour ne plus le copier dans
 * ChatGPT (retour de Thomas du 28 octobre 2026). La case libre couvre le reste.
 */
export const FOLLOW_UP_EMAIL_QUICK_REVISIONS = [
  {
    id: "shorter",
    label: "Plus court",
    instruction:
      "Raccourcis le mail d'environ un tiers. Garde la proposition de rendez-vous et ce que chacun prépare.",
  },
  {
    id: "longer",
    label: "Plus détaillé",
    instruction:
      "Développe un peu le mail : précise les enjeux du prospect et ce que le prochain rendez-vous lui apportera, sans rien inventer.",
  },
  {
    id: "formal",
    label: "Plus formel",
    instruction: "Rends le ton plus formel et soutenu, au vouvoiement.",
  },
  {
    id: "warm",
    label: "Plus chaleureux",
    instruction:
      "Rends le ton plus chaleureux et personnel, sans familiarité excessive.",
  },
  {
    id: "direct",
    label: "Plus direct",
    instruction:
      "Rends le mail plus direct : phrases courtes, la proposition de rendez-vous dès le début.",
  },
] as const;
