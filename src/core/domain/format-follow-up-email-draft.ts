import type { FollowUpEmailResult } from "./follow-up-email-zod";

const SUBJECT_PREFIX = "Objet : ";

export function formatFollowUpEmailBody(email: FollowUpEmailResult): string {
  return [
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

export function composeFollowUpEmailDraft(
  subject: string,
  body: string,
): string {
  const trimmedSubject = subject.trim();
  const trimmedBody = body.trim();
  if (!trimmedSubject && !trimmedBody) return "";
  if (!trimmedSubject) return trimmedBody;
  if (!trimmedBody) return `${SUBJECT_PREFIX}${trimmedSubject}`;
  return `${SUBJECT_PREFIX}${trimmedSubject}\n\n${trimmedBody}`;
}

export function parseFollowUpEmailDraft(draft: string | null | undefined): {
  subject: string;
  body: string;
} {
  if (!draft?.trim()) return { subject: "", body: "" };

  const lines = draft.split("\n");
  const firstLine = lines[0]?.trim() ?? "";
  if (firstLine.startsWith(SUBJECT_PREFIX)) {
    const subject = firstLine.slice(SUBJECT_PREFIX.length).trim();
    const body = lines.slice(1).join("\n").replace(/^\n+/, "");
    return { subject, body };
  }

  return { subject: "", body: draft };
}

export function formatFollowUpEmailDraft(email: FollowUpEmailResult): string {
  return composeFollowUpEmailDraft(
    email.subject,
    formatFollowUpEmailBody(email),
  );
}
