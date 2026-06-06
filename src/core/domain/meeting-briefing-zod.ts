import { z } from "zod";

export const meetingBriefingSchema = z.object({
  lastMeetingSummary: z.string(),
  discDominant: z.string().nullable(),
  soncasDominant: z.string().nullable(),
  startActions: z.array(z.string()).max(8),
  customQuestions: z.array(z.string()).max(8),
  openPoints: z.array(z.string()).max(8),
  stageAdvice: z.string(),
  genericAdvice: z.boolean(),
});

export type MeetingBriefingResult = z.infer<typeof meetingBriefingSchema>;
