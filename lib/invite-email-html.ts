/** Placeholder remplacé par le lien d’acceptation unique pour chaque destinataire à l’envoi. */
export const INVITE_LINK_PLACEHOLDER = "{{INVITATION_LINK}}";

/** Message d’invitation par défaut (HTML). Réexporté depuis `onboarding-defaults` sous le nom historique. */
export const DEFAULT_INVITE_MESSAGE_HTML = `<p>Salut, on lance Sales Time dans l'équipe. C'est un coach commercial IA qui va t'aider à gagner du temps sur tes CR, tes mails de suivi, et te donner des feedbacks concrets.</p><p><a href="${INVITE_LINK_PLACEHOLDER}">Inscris-toi pour démarrer</a></p>`;

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
export function coerceStoredInviteMessageToHtml(
  raw: string | null | undefined,
): string {
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

/** « 3 novembre 2026 », à l'heure de Paris. */
function frenchDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

/** L'objet du mail : qui invite, et où. */
export function invitationEmailSubject(opts: {
  organizationName: string;
  inviterName?: string | null;
}): string {
  const inviter = opts.inviterName?.trim();
  return inviter
    ? `${inviter} vous invite sur Sales Time · ${opts.organizationName}`
    : `Invitation à rejoindre ${opts.organizationName} sur Sales Time`;
}

/**
 * Le mail d'invitation.
 *
 * Retour du 20 octobre 2026 : un invité cherchait « le mot de passe à
 * activer » et passait par « mot de passe oublié », qui ne peut rien envoyer
 * à une adresse sans compte. Le mail dit donc qui invite, ce qu'est Sales
 * Time, que l'on choisit son mot de passe en créant son compte, jusqu'à quand
 * le lien vaut, et donne le lien en clair si le bouton ne s'ouvre pas.
 */
export function buildInvitationEmailHtml(opts: {
  organizationName: string;
  inviteLink: string;
  bodyHtml: string;
  inviterName?: string | null;
  expiresAt?: Date | null;
}): string {
  const trimmed = opts.bodyHtml.trim();
  const body =
    trimmed.length > 0
      ? personalizeInviteBodyHtml(trimmed, opts.inviteLink)
      : personalizeInviteBodyHtml(DEFAULT_INVITE_MESSAGE_HTML, opts.inviteLink);

  const org = escapeHtml(opts.organizationName);
  const link = escapeHtml(opts.inviteLink);
  const inviter = opts.inviterName?.trim();
  const who = inviter
    ? `<strong>${escapeHtml(inviter)}</strong> vous invite`
    : "Vous êtes invité";
  const until = opts.expiresAt
    ? ` Ce lien est valable jusqu’au ${escapeHtml(frenchDate(opts.expiresAt))}.`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.55;color:#111;">
${body}
<hr style="margin:24px 0;border:none;border-top:1px solid #e5e5e5" />
<p style="margin:0 0 12px">${who} à rejoindre <strong>${org}</strong> sur Sales Time, le coach commercial qui analyse vos rendez-vous et vous dit où progresser.</p>
<p style="margin:0 0 16px"><a href="${link}" style="display:inline-block;background:#5b21b6;color:#ffffff;font-weight:600;text-decoration:none;padding:12px 20px;border-radius:8px">Créer mon compte</a></p>
<p style="margin:0 0 8px;font-size:14px;color:#444">Vous choisirez votre mot de passe en créant votre compte : inutile de passer par « mot de passe oublié ».${until}</p>
<p style="margin:0;font-size:13px;color:#666">Le bouton ne s’ouvre pas ? Copiez ce lien dans votre navigateur :<br />${link}</p>
</body>
</html>`;
}
