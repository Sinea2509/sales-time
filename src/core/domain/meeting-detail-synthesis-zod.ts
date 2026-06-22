import { z } from "zod";

export const meetingDetailSynthesisSchema = z.object({
  meetingSynthesis: z.string().min(1),
  interlocutorProfile: z.string().min(1),
});

export type MeetingDetailSynthesisResult = z.infer<
  typeof meetingDetailSynthesisSchema
>;
