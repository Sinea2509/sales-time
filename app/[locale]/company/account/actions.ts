"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateOpaqueToken } from "@/lib/auth/tokens";
import { blobUrlBelongsToUser } from "@/lib/blob-paths";
import { getApplicationDeps } from "@/lib/application-deps";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { sendTransactionalEmail } from "@/lib/email/mailer";
import { uploadUserAvatarToBlob } from "@/lib/user-avatar-upload";

const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(8).max(200),
    confirmPassword: z.string().max(200),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type AccountActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

async function requireAuthenticatedUserId(): Promise<string | null> {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  return principal?.userId ?? null;
}

export async function updateAccountProfileAction(
  input: z.infer<typeof profileSchema>,
): Promise<AccountActionResult> {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return { ok: false, message: "Session expirée." };
  }

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Vérifiez le prénom et le nom." };
  }

  const deps = getApplicationDeps();
  await deps.users.updateAccountProfile({
    userId,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
  });

  revalidatePath("/company/account");
  revalidatePath("/company", "layout");
  return { ok: true, message: "Profil enregistré." };
}

export async function uploadAccountAvatarAction(
  formData: FormData,
): Promise<AccountActionResult> {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return { ok: false, message: "Session expirée." };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return { ok: false, message: "Aucun fichier reçu." };
  }

  const uploaded = await uploadUserAvatarToBlob(userId, file);
  if (!uploaded.ok) {
    return { ok: false, message: uploaded.message };
  }

  if (!blobUrlBelongsToUser(uploaded.url, userId)) {
    return { ok: false, message: "Téléversement invalide." };
  }

  const deps = getApplicationDeps();
  await deps.users.updateAvatarUrl(userId, uploaded.url);

  revalidatePath("/company/account");
  revalidatePath("/company", "layout");
  return { ok: true, message: "Photo de profil enregistrée." };
}

export async function removeAccountAvatarAction(): Promise<AccountActionResult> {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return { ok: false, message: "Session expirée." };
  }

  const deps = getApplicationDeps();
  await deps.users.updateAvatarUrl(userId, null);

  revalidatePath("/company/account");
  revalidatePath("/company", "layout");
  return { ok: true, message: "Photo de profil supprimée." };
}

export async function changeAccountPasswordAction(
  input: z.infer<typeof changePasswordSchema>,
): Promise<AccountActionResult> {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return { ok: false, message: "Session expirée." };
  }

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors.confirmPassword?.[0] ??
      parsed.error.flatten().fieldErrors.newPassword?.[0] ??
      "Mot de passe invalide.";
    return { ok: false, message: msg };
  }

  const deps = getApplicationDeps();
  const passwordHash = await deps.users.findPasswordHashByUserId(userId);
  if (!passwordHash) {
    return { ok: false, message: "Compte introuvable." };
  }

  const currentOk = await verifyPassword(
    passwordHash,
    parsed.data.currentPassword,
  );
  if (!currentOk) {
    return { ok: false, message: "Mot de passe actuel incorrect." };
  }

  const nextHash = await hashPassword(parsed.data.newPassword);
  await deps.users.updatePasswordHash(userId, nextHash);

  return { ok: true, message: "Mot de passe mis à jour." };
}

export async function sendAccountPasswordResetEmailAction(): Promise<AccountActionResult> {
  const userId = await requireAuthenticatedUserId();
  if (!userId) {
    return { ok: false, message: "Session expirée." };
  }

  const deps = getApplicationDeps();
  const email = await deps.users.findEmailById(userId);
  if (!email) {
    return { ok: false, message: "Compte introuvable." };
  }

  const user = await deps.passwordReset.findActiveUserByEmail(email);
  if (!user) {
    return { ok: false, message: "Compte introuvable." };
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
    subject: "Réinitialiser votre mot de passe — Sales Time",
    html: `<p>Bonjour,</p><p><a href="${link}">Cliquez ici pour choisir un nouveau mot de passe</a>.</p><p>Ce lien expire dans une heure.</p>`,
  });

  return {
    ok: true,
    message: `Un e-mail de réinitialisation a été envoyé à ${email}.`,
  };
}
