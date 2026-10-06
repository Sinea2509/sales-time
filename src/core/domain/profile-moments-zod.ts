import { z } from "zod";

/**
 * Les passages-clés d'un rendez-vous, tels que SONCAS et DISC les relèvent.
 * Voir `profile-moments.ts` pour la méthode.
 */

export const SONCAS_LEVERS = [
  "securite",
  "orgueil",
  "nouveaute",
  "confort",
  "argent",
  "sympathie",
] as const;
export type SoncasLever = (typeof SONCAS_LEVERS)[number];

export const DISC_STYLES = ["D", "I", "S", "C"] as const;
export type DiscStyle = (typeof DISC_STYLES)[number];

export const MOMENT_STRENGTHS = ["faible", "nette"] as const;

/** Les sujets des passages qui révèlent une motivation d'achat. */
export const SONCAS_MOMENT_TOPICS = [
  "attentes",
  "criteres_de_choix",
  "experience_passee",
  "reaction_au_prix",
  "conditions",
  "objection",
  "decision",
  "relation",
] as const;

/** Les situations qui révèlent un style de communication. */
export const DISC_MOMENT_SITUATIONS = [
  "reponse_a_une_question",
  "reaction_au_prix",
  "reaction_a_une_proposition",
  "objection",
  "prise_d_initiative",
  "fin_de_rendez_vous",
  "autre",
] as const;

export const soncasMomentSchema = z.object({
  /** L'horodatage recopié du transcript, ou un repère court ; vide sinon. */
  moment: z.string().max(40),
  topic: z.enum(SONCAS_MOMENT_TOPICS),
  /** La question ou la relance du commercial qui a amené la réponse ; vide si le prospect parle de lui-même. */
  sellerQuestion: z.string().max(400),
  /** Les mots du prospect, recopiés mot pour mot. */
  prospectWords: z.string().min(1).max(500),
  levers: z
    .array(
      z.object({
        lever: z.enum(SONCAS_LEVERS),
        strength: z.enum(MOMENT_STRENGTHS),
      }),
    )
    .min(1)
    .max(3),
  /** Ce que ce passage révèle, en une phrase. */
  reading: z.string().min(1).max(300),
});

export const discMomentSchema = z.object({
  moment: z.string().max(40),
  situation: z.enum(DISC_MOMENT_SITUATIONS),
  prospectWords: z.string().min(1).max(500),
  /** Comment le prospect le dit : rythme, ton, structure, réaction. */
  behaviour: z.string().min(1).max(300),
  styles: z
    .array(
      z.object({
        style: z.enum(DISC_STYLES),
        strength: z.enum(MOMENT_STRENGTHS),
      }),
    )
    .min(1)
    .max(2),
});

export type SoncasMoment = z.infer<typeof soncasMomentSchema>;
export type DiscMoment = z.infer<typeof discMomentSchema>;
