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
