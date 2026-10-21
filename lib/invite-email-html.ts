// cspell:words cellspacing bgcolor
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

/** Les initiales d'un nom, pour la pastille de la personne qui invite. */
function initials(name: string): string {
  const parts = name.split(/\s+/u).filter(Boolean);
  const letters =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : (parts[0]?.slice(0, 2) ?? "");
  return letters.toUpperCase();
}

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Ce qui attend l'invité : une couleur, un titre et un texte par étape. */
const NEXT_STEPS: readonly (readonly [string, string, string])[] = [
  [
    "#6C4DFF",
    "Déposez un rendez-vous",
    "Le transcript Teams, Zoom ou Meet, ou un simple enregistrement audio.",
  ],
  [
    "#F2547A",
    "Recevez votre analyse",
    "Une note sur 100, le profil de votre prospect et ses objections.",
  ],
  [
    "#F2902A",
    "Progressez",
    "La phrase à dire au prochain rendez-vous, critère par critère.",
  ],
];

function nextStepRow(
  [color, title, text]: readonly [string, string, string],
  n: number,
): string {
  return `<tr>
<td width="40" valign="top" style="padding:0 0 16px 0;">
<div style="width:28px;height:28px;line-height:28px;border-radius:14px;background:${color};color:#ffffff;font-family:${FONT};font-size:13px;font-weight:700;text-align:center;">${n}</div>
</td>
<td valign="top" style="padding:3px 0 16px 0;font-family:${FONT};">
<div style="font-size:15px;font-weight:600;color:#15121F;">${title}</div>
<div style="font-size:14px;line-height:1.5;color:#5B5870;">${text}</div>
</td>
</tr>`;
}

/**
 * Le mail d'invitation.
 *
 * Retour du 20 octobre 2026 : un invité cherchait « le mot de passe à
 * activer » et passait par « mot de passe oublié », qui ne peut rien envoyer
 * à une adresse sans compte. Le mail dit donc qui invite, que l'on choisit
 * son mot de passe en créant son compte, jusqu'à quand le lien vaut, et donne
 * le lien en clair si le bouton ne s'ouvre pas.
 *
 * Mise en forme du 21 octobre 2026 (« on peut améliorer les mails reçus ? ») :
 * un bandeau aux couleurs de Sales Time, le mot de la personne qui invite mis
 * en avant, un seul grand bouton et les trois étapes qui attendent l'invité.
 * Tout est en tableaux et en styles en ligne, la seule mise en page que
 * respectent Outlook et Gmail ; le logo est dessiné en HTML, pour s'afficher
 * même quand les images sont bloquées.
 */
export function buildInvitationEmailHtml(opts: {
  organizationName: string;
  inviteLink: string;
  bodyHtml: string;
  inviterName?: string | null;
  expiresAt?: Date | null;
}): string {
  const trimmed = opts.bodyHtml.trim();
  // Les liens du message, sans style à eux, prennent la couleur de la marque
  // plutôt que le bleu par défaut des messageries.
  const body = (
    trimmed.length > 0
      ? personalizeInviteBodyHtml(trimmed, opts.inviteLink)
      : personalizeInviteBodyHtml(DEFAULT_INVITE_MESSAGE_HTML, opts.inviteLink)
  ).replace(
    /<a (?![^>]*\bstyle=)/gu,
    '<a style="color:#6C4DFF;font-weight:600;" ',
  );

  const org = escapeHtml(opts.organizationName);
  const link = escapeHtml(opts.inviteLink);
  const inviterRaw = opts.inviterName?.trim() || null;
  const inviter = inviterRaw ? escapeHtml(inviterRaw) : null;
  const title = inviter
    ? `<strong>${inviter}</strong> vous invite à rejoindre ${org}`
    : `Vous êtes invité à rejoindre ${org}`;
  const inboxPreview = inviter
    ? `${inviter} vous invite à rejoindre ${org} sur Sales Time. Créez votre compte en une minute.`
    : `Rejoignez ${org} sur Sales Time. Créez votre compte en une minute.`;
  const until = opts.expiresAt
    ? ` Ce lien est valable jusqu’au <strong>${escapeHtml(frenchDate(opts.expiresAt))}</strong>.`
    : "";
  const avatar = inviterRaw
    ? `<td width="56" valign="middle" style="padding:0 14px 0 0;">
<div style="width:48px;height:48px;line-height:48px;border-radius:24px;background:#EDE8FF;color:#5B3DF5;font-family:${FONT};font-size:17px;font-weight:700;text-align:center;">${escapeHtml(initials(inviterRaw))}</div>
</td>`
    : "";
  const quoteLabel = inviter
    ? `Le mot de ${inviter}`
    : "Le message de l’équipe";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>Invitation Sales Time</title>
</head>
<body style="margin:0;padding:0;background:#F4F2FB;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${inboxPreview}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F2FB;">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E7E3F5;">

<tr><td style="background:#0B0915;background-image:linear-gradient(135deg,#1B1240 0%,#0B0915 55%,#2A1222 100%);padding:22px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="30" height="30" style="width:30px;height:30px;line-height:30px;border-radius:8px;background:#6C4DFF;color:#ffffff;font-family:${FONT};font-size:17px;font-weight:700;text-align:center;">&#8599;</td>
<td style="padding-left:10px;font-family:${FONT};font-size:16px;font-weight:700;color:#ffffff;">Sales Time</td>
</tr></table>
</td></tr>

<tr><td style="padding:32px 32px 8px 32px;">
<div style="font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#6C4DFF;">Invitation · ${org}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;"><tr>
${avatar}
<td valign="middle" style="font-family:${FONT};font-size:22px;line-height:1.3;color:#15121F;">${title}</td>
</tr></table>
<p style="margin:16px 0 0 0;font-family:${FONT};font-size:15px;line-height:1.6;color:#5B5870;">Sales Time est votre coach commercial : après chaque rendez-vous, il vous dit ce qui a marché, ce qui a manqué, et comment faire mieux la prochaine fois.</p>
</td></tr>

<tr><td style="padding:20px 32px 0 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="border-left:3px solid #6C4DFF;background:#F7F5FF;border-radius:0 10px 10px 0;padding:14px 18px;font-family:${FONT};font-size:15px;line-height:1.6;color:#2A2640;">
<div style="font-size:12px;font-weight:700;color:#6C4DFF;margin-bottom:4px;">${quoteLabel}</div>
${body}
</td>
</tr></table>
</td></tr>

<tr><td align="center" style="padding:28px 32px 6px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" bgcolor="#6C4DFF" style="border-radius:10px;background:#6C4DFF;">
<a href="${link}" style="display:inline-block;padding:15px 34px;font-family:${FONT};font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">Créer mon compte</a>
</td>
</tr></table>
<p style="margin:10px 0 0 0;font-family:${FONT};font-size:13px;color:#7A7690;">1 minute · vous choisissez votre mot de passe en créant votre compte</p>
</td></tr>

<tr><td style="padding:28px 32px 4px 32px;">
<div style="border-top:1px solid #EEEAF8;padding-top:24px;margin-bottom:16px;font-family:${FONT};font-size:13px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#15121F;">Ce qui vous attend</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${NEXT_STEPS.map((s, i) => nextStepRow(s, i + 1)).join("\n")}
</table>
</td></tr>

<tr><td style="padding:4px 32px 28px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="background:#FFF5EF;border-radius:10px;padding:14px 16px;font-family:${FONT};font-size:14px;line-height:1.55;color:#5A3A2A;">
Pas de mot de passe à chercher : vous choisirez votre mot de passe en créant votre compte, inutile de passer par « mot de passe oublié ».${until}
</td>
</tr></table>
</td></tr>

<tr><td style="background:#FAF9FD;border-top:1px solid #EEEAF8;padding:20px 32px;font-family:${FONT};font-size:12px;line-height:1.6;color:#8A86A0;">
Le bouton ne s’ouvre pas ? Copiez ce lien dans votre navigateur :<br />
<a href="${link}" style="color:#6C4DFF;word-break:break-all;">${link}</a>
<br /><br />
Vous recevez ce mail parce que ${inviter ?? "un membre de l’équipe"} vous a invité à rejoindre ${org} sur Sales Time. Si vous ne vous y attendiez pas, vous pouvez l’ignorer.
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
