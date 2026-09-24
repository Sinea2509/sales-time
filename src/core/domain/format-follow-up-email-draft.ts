import type { FollowUpEmailResult } from "./follow-up-email-zod";

const SUBJECT_PREFIX = "Objet : ";

/**
 * Un champ du mail sans les espaces laissées en fin de ligne par le modèle.
 *
 * Elles ne se voient pas à l'écran, mais partent dans le mail copié : au
 * deuxième essai en production, « Bonjour Claire, » en portait une.
 */
function tidyEmailField(text: string | null | undefined): string {
  return (text ?? "")
    .split("\n")
    .map((line) => line.replace(/[ \t\u00a0\u202f]+$/u, ""))
    .join("\n")
    .trim();
}

export function formatFollowUpEmailBody(email: FollowUpEmailResult): string {
  return [
    tidyEmailField(email.greeting),
    "",
    tidyEmailField(email.painPoints),
    "",
    tidyEmailField(email.proposedSolutions),
    "",
    tidyEmailField(email.nextSteps),
    "",
    tidyEmailField(email.closing),
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
