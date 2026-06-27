import { z } from "zod";

/** Conseils actionnables liés au profil dominant (DISC ou SONCAS). */
export const profileActionableAdviceSchema = z.object({
  whatItMeans: z.string().min(1).max(1500),
  howToTalk: z.string().min(1).max(1500),
  whatToAvoid: z.string().min(1).max(1500),
});

export type ProfileActionableAdvice = z.infer<typeof profileActionableAdviceSchema>;

export const soncasDriverBlockSchema = z.object({
  score: z.number().min(0).max(100),
  evidence: z.array(z.string()),
});

const soncasResultBaseSchema = z.object({
  drivers: z.object({
    securite: soncasDriverBlockSchema,
    orgueil: soncasDriverBlockSchema,
    nouveaute: soncasDriverBlockSchema,
    confort: soncasDriverBlockSchema,
    argent: soncasDriverBlockSchema,
    sympathie: soncasDriverBlockSchema,
  }),
  dominant: z.enum([
    "securite",
    "orgueil",
    "nouveaute",
    "confort",
    "argent",
    "sympathie",
  ]),
  summary: z.string(),
  actionableAdvice: profileActionableAdviceSchema.optional(),
});

export const soncasResultSchema = soncasResultBaseSchema;

/** Schéma strict pour la génération IA (conseils obligatoires). */
export const soncasAnalysisOutputSchema = soncasResultBaseSchema.extend({
  actionableAdvice: profileActionableAdviceSchema,
});

const discResultBaseSchema = z.object({
  scores: z.object({
    D: z.number().min(0).max(100),
    I: z.number().min(0).max(100),
    S: z.number().min(0).max(100),
    C: z.number().min(0).max(100),
  }),
  dominant: z.enum(["D", "I", "S", "C"]),
  evidence: z.array(z.string()),
  summary: z.string(),
  actionableAdvice: profileActionableAdviceSchema.optional(),
});

export const discResultSchema = discResultBaseSchema;

/** Schéma strict pour la génération IA (conseils obligatoires). */
export const discAnalysisOutputSchema = discResultBaseSchema.extend({
  actionableAdvice: profileActionableAdviceSchema,
});

export type SoncasAnalysisResult = z.infer<typeof soncasResultSchema>;
export type DiscAnalysisResult = z.infer<typeof discResultSchema>;
