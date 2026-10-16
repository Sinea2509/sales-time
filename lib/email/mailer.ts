import { Resend } from "resend";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

/** Le service d'envoi n'est pas configuré : rien ne peut partir. */
export class EmailNotConfiguredError extends Error {
  constructor() {
    super(
      "Envoi de mails non configuré : ajoutez BREVO_API_KEY et EMAIL_FROM dans les variables d'environnement.",
    );
    this.name = "EmailNotConfiguredError";
  }
}

const DEFAULT_FROM = "Sales Time <onboarding@resend.dev>";

/** « Sales Time <bonjour@exemple.fr> » ou « bonjour@exemple.fr ». */
export function parseEmailFrom(from: string): { name?: string; email: string } {
  const match = /^\s*(.*?)\s*<\s*([^>\s]+)\s*>\s*$/.exec(from);
  if (match) {
    const name = match[1].replace(/^"|"$/g, "").trim();
    return name ? { name, email: match[2] } : { email: match[2] };
  }
  return { email: from.trim() };
}

async function sendWithBrevo(
  apiKey: string,
  from: string,
  input: SendEmailInput,
): Promise<void> {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: parseEmailFrom(from),
      to: [{ email: input.to }],
      subject: input.subject,
      htmlContent: input.html,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Brevo a refusé l'envoi (${response.status}) : ${detail.slice(0, 300)}`,
    );
  }
}

async function sendWithResend(
  apiKey: string,
  from: string,
  input: SendEmailInput,
): Promise<void> {
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Envoie un mail par Brevo (`BREVO_API_KEY`), sinon par Resend
 * (`RESEND_API_KEY`).
 *
 * Sans aucune clé, le mail est seulement écrit dans le journal en
 * développement. En production, c'est une erreur : jusqu'au 16 octobre 2026,
 * l'absence de clé passait en silence et aucune invitation, aucun mot de
 * passe oublié ni aucun avis d'analyse ne partait, sans que personne le voie.
 */
export async function sendTransactionalEmail(
  input: SendEmailInput,
): Promise<void> {
  const from = process.env.EMAIL_FROM?.trim() || DEFAULT_FROM;
  const brevoKey = process.env.BREVO_API_KEY?.trim();
  if (brevoKey) return sendWithBrevo(brevoKey, from, input);
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) return sendWithResend(resendKey, from, input);
  if (process.env.VERCEL_ENV === "production") {
    throw new EmailNotConfiguredError();
  }
  console.info("[email:dev]", {
    to: input.to,
    subject: input.subject,
  });
}
