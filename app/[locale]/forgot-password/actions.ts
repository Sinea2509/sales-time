"use server";

import { z } from "zod";
import { generateOpaqueToken, hashToken } from "@/lib/auth/tokens";
import {
  buildInvitationEmailHtml,
  invitationEmailSubject,
} from "@/lib/invite-email-html";
import { getApplicationDeps } from "@/lib/application-deps";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { sendTransactionalEmail } from "@/lib/email/mailer";

const schema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((e) => e.toLowerCase()),
});

export type ForgotPasswordState = { ok: true } | { ok: false; message: string };

export async function forgotPasswordAction(
  _prev: ForgotPasswordState | null,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, message: "E-mail invalide." };
  }

  const deps = getApplicationDeps();
  const user = await deps.passwordReset.findActiveUserByEmail(
    parsed.data.email,
  );
  if (!user) {
    /*
      Pas de compte, mais peut-être une invitation en attente : l'invité qui
      passe par ici cherche le mot de passe qu'il n'a pas encore choisi
      (retour du 20 octobre 2026). On lui renvoie son invitation, avec un lien
      neuf, au lieu de ne rien envoyer. La réponse reste la même dans tous les
      cas : elle ne dit pas si l'adresse existe.
    */
    const invitation =
      await deps.organizationInvitations.findLatestPendingForEmail(
        parsed.data.email,
      );
    if (invitation) {
      const rawInvite = generateOpaqueToken(32);
      await deps.organizationInvitations.replaceTokenHash({
        id: invitation.id,
        tokenHash: hashToken(rawInvite),
      });
      const inviteLink = `${getAppBaseUrl()}/invitations/${encodeURIComponent(rawInvite)}`;
      await sendTransactionalEmail({
        to: parsed.data.email,
        subject: invitationEmailSubject({
          organizationName: invitation.organizationName,
          inviterName: invitation.inviterName,
        }),
        html: buildInvitationEmailHtml({
          organizationName: invitation.organizationName,
          inviteLink,
          bodyHtml:
            "<p>Vous avez demandé un nouveau mot de passe, mais votre compte Sales Time n'existe pas encore : il suffit de le créer avec le bouton ci-dessous, en choisissant votre mot de passe.</p>",
          inviterName: invitation.inviterName,
          expiresAt: invitation.expiresAt,
        }),
      });
    }
    return { ok: true };
  }

  const raw = generateOpaqueToken(32);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await deps.passwordReset.createResetToken({
    userId: user.id,
    rawToken: raw,
    expiresAt,
  });

  const base = getAppBaseUrl();
  const link = `${base}/reset-password/${raw}`;

  await sendTransactionalEmail({
    to: user.email,
    subject: "Réinitialiser votre mot de passe · Sales Time",
    html: `<p>Bonjour,</p><p><a href="${link}">Cliquez ici pour choisir un nouveau mot de passe</a>.</p><p>Ce lien expire dans une heure.</p>`,
  });

  return { ok: true };
}
