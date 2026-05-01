/** Placeholder remplacé par le lien d’acceptation unique pour chaque destinataire à l’envoi. */
export const INVITE_LINK_PLACEHOLDER = "{{INVITATION_LINK}}";

/** Message d’invitation par défaut (HTML). Réexporté depuis `onboarding-defaults` sous le nom historique. */
export const DEFAULT_INVITE_MESSAGE_HTML = `<p>Salut, on lance SalesTime dans l'équipe. C'est un coach commercial IA qui va t'aider à gagner du temps sur tes CR, tes mails de suivi, et te donner des feedbacks concrets.</p><p><a href="${INVITE_LINK_PLACEHOLDER}">Inscris-toi pour démarrer</a></p>`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapePlainToParagraphs(text: string): string {
  const lines = text.split(/\r?\n/).map((l) => escapeHtml(l));
  if (lines.length === 1) {
    return `<p>${lines[0]}</p>`;
  }
  return lines.map((l) => `<p>${l || "<br />"}</p>`).join("");
}

/** Anciens brouillons texte brut → HTML affichable dans l’éditeur. */
export function coerceStoredInviteMessageToHtml(raw: string | null | undefined): string {
  const s = raw?.trim() ?? "";
  if (!s) return DEFAULT_INVITE_MESSAGE_HTML;
  if (s.includes("<")) return s;
  return escapePlainToParagraphs(s);
}

export function personalizeInviteBodyHtml(
  template: string,
  inviteLink: string,
): string {
  return template.split(INVITE_LINK_PLACEHOLDER).join(inviteLink);
}

export function buildInvitationEmailHtml(opts: {
  organizationName: string;
  inviteLink: string;
  bodyHtml: string;
}): string {
  const trimmed = opts.bodyHtml.trim();
  const body =
    trimmed.length > 0
      ? personalizeInviteBodyHtml(trimmed, opts.inviteLink)
      : personalizeInviteBodyHtml(DEFAULT_INVITE_MESSAGE_HTML, opts.inviteLink);

  const org = escapeHtml(opts.organizationName);
  const link = escapeHtml(opts.inviteLink);

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.55;color:#111;">
${body}
<hr style="margin:24px 0;border:none;border-top:1px solid #e5e5e5" />
<p style="margin:0 0 8px;font-size:14px;color:#444">Invitation à rejoindre <strong>${org}</strong> sur Sales Time.</p>
<p style="margin:0"><a href="${link}" style="color:#5b21b6;font-weight:600">Accepter l’invitation</a></p>
</body>
</html>`;
}
