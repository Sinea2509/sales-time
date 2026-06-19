import { z } from "zod";

export const meetingIdSchema = z.string().cuid();
