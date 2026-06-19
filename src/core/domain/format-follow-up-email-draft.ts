import type { FollowUpEmailResult } from "./follow-up-email-zod";

export function formatFollowUpEmailDraft(email: FollowUpEmailResult): string {
  return [
    `Objet : ${email.subject}`,
    "",
    email.greeting,
    "",
    email.painPoints,
    "",
    email.proposedSolutions,
    "",
    email.nextSteps,
    "",
    email.closing,
  ].join("\n");
}
