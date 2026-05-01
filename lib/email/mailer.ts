import { Resend } from "resend";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Sends via Resend when `RESEND_API_KEY` is set; otherwise logs (dev fallback).
 */
export async function sendTransactionalEmail(
  input: SendEmailInput,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.info("[email:dev]", {
      to: input.to,
      subject: input.subject,
    });
    return;
  }
  const resend = new Resend(apiKey);
  const from =
    process.env.EMAIL_FROM?.trim() ?? "Sales Time <onboarding@resend.dev>";
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
