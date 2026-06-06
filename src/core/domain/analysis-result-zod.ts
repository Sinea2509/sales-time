import { z } from "zod";

export const soncasDriverBlockSchema = z.object({
  score: z.number().min(0).max(100),
  evidence: z.array(z.string()),
});

export const soncasResultSchema = z.object({
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
});

export const discResultSchema = z.object({
  scores: z.object({
    D: z.number(),
    I: z.number(),
    S: z.number(),
    C: z.number(),
  }),
  dominant: z.enum(["D", "I", "S", "C"]),
  evidence: z.array(z.string()),
  summary: z.string(),
});

export type SoncasAnalysisResult = z.infer<typeof soncasResultSchema>;
export type DiscAnalysisResult = z.infer<typeof discResultSchema>;
