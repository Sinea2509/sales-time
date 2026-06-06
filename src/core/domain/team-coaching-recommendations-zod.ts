import { z } from "zod";

export const teamCoachingRecommendationsSchema = z.object({
  progressBullets: z.array(z.string().min(1).max(400)).min(1).max(5),
  improvementBullets: z.array(z.string().min(1).max(400)).min(1).max(5),
});

export type TeamCoachingRecommendations = z.infer<
  typeof teamCoachingRecommendationsSchema
>;
