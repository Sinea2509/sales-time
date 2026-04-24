import { z } from "zod";

export const kissResultSchema = z.object({
  keep: z.array(z.string()).max(20),
  improve: z.array(z.string()).max(20),
  stop: z.array(z.string()).max(20),
  start: z.array(z.string()).max(20),
  goldenQuestion: z.string().min(1).max(500),
  coachingScore: z.number().int().min(0).max(10),
  coachingScoreJustification: z.string().min(1).max(2000),
  summary: z.string().min(1).max(4000),
});

export type KissAnalysisResult = z.infer<typeof kissResultSchema>;
