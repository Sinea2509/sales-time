"use server";

import { z } from "zod";
import { generateOpaqueToken, hashToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/email/mailer";

const schema = z.object({
  email: z.string().trim().email().transform((e) => e.toLowerCase()),
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

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user) {
    return { ok: true };
  }

  const raw = generateOpaqueToken(32);
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const base =
    process.env.APP_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  const link = `${base}/reset-password/${raw}`;

  await sendTransactionalEmail({
    to: user.email,
    subject: "Réinitialiser votre mot de passe — Sales Time",
    html: `<p>Bonjour,</p><p><a href="${link}">Cliquez ici pour choisir un nouveau mot de passe</a>.</p><p>Ce lien expire dans une heure.</p>`,
  });

  return { ok: true };
}
