"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { generateOpaqueToken } from "@/lib/auth/tokens";
import {
  setActiveOrganizationCookie,
  setSessionCookie,
} from "@/lib/auth/session-cookie";
import { getApplicationDeps } from "@/lib/application-deps";

const schema = z
  .object({
    firstName: z.string().trim().min(1, "Le prénom est requis").max(80),
    lastName: z.string().trim().min(1, "Le nom est requis").max(80),
    password: z.string().min(8, "Au moins 8 caractères.").max(200),
    confirmPassword: z.string().min(1).max(200),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type RegisterFromInvitationState = { ok: false; message: string } | null;

export async function registerFromInvitationAction(
  token: string,
  _prev: RegisterFromInvitationState,
  formData: FormData,
): Promise<RegisterFromInvitationState> {
  const parsed = schema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const msg =
      flat.fieldErrors.firstName?.[0] ??
      flat.fieldErrors.lastName?.[0] ??
      flat.fieldErrors.password?.[0] ??
      flat.fieldErrors.confirmPassword?.[0] ??
      "Vérifiez les champs.";
    return { ok: false, message: msg };
  }

  const deps = getApplicationDeps();
  const preview =
    await deps.organizationInvitations.findPendingByTokenForPreview(token);
  if (!preview) {
    return {
      ok: false,
      message: "Ce lien d’invitation est invalide ou a expiré.",
    };
  }

  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (principal) {
    if (principal.email.toLowerCase() === preview.email.toLowerCase()) {
      return {
        ok: false,
        message:
          "Vous êtes déjà connecté avec ce compte. Retournez à la page d’invitation pour accepter.",
      };
    }
    return {
      ok: false,
      message: `Vous êtes connecté en tant que ${principal.email}. Déconnectez-vous pour créer le compte invité.`,
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const reg = await deps.registration.registerFromOrganizationInvitation({
    tokenPlaintext: token,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    passwordHash,
  });

  if (!reg.ok) {
    if (reg.error === "EMAIL_TAKEN") {
      return {
        ok: false,
        message:
          "Un compte existe déjà avec cet e-mail. Connectez-vous puis acceptez l’invitation depuis le lien reçu.",
      };
    }
    return {
      ok: false,
      message: "Ce lien d’invitation est invalide ou a expiré.",
    };
  }

  const raw = generateOpaqueToken();
  await deps.session.createSessionRecord({
    userId: reg.userId,
    rawToken: raw,
    userAgent: null,
  });
  await setSessionCookie(raw);
  await setActiveOrganizationCookie(reg.organizationId);

  await deps.audit.logPlatformAction({
    actorUserId: reg.userId,
    organizationId: reg.organizationId,
    action: "USER_JOIN_ORGANIZATION",
    reason: "Inscription via invitation organisation",
  });

  redirect("/company");
}
