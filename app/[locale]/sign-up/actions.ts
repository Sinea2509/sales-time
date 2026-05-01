"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { getApplicationDeps } from "@/lib/application-deps";
import { generateOpaqueToken } from "@/lib/auth/tokens";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { tryNormalizeWebsiteForOrgKey } from "@/lib/website/normalize-website";
import { verifyWebsiteReachable } from "@/lib/website/verify-website-reachable";
import { USER_PROFILE_ROLES } from "@/src/core/domain/user-profile-role";

const profileRoleSchema = z.enum(USER_PROFILE_ROLES);

const schema = z
  .object({
    firstName: z.string().trim().min(1, "Le prénom est requis").max(80),
    lastName: z.string().trim().min(1, "Le nom est requis").max(80),
    companyName: z
      .string()
      .trim()
      .min(1, "Le nom de l'entreprise est requis.")
      .max(200),
    email: z
      .string()
      .trim()
      .email()
      .transform((e) => e.toLowerCase()),
    website: z.string().trim().min(1, "Le site web est requis.").max(500),
    profileRole: profileRoleSchema,
    password: z.string().min(8, "Au moins 8 caractères.").max(200),
    confirmPassword: z.string().min(1).max(200),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type SignUpState = { ok: false; message: string } | null;

export async function signUpAction(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const parsed = schema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    website: formData.get("website"),
    profileRole: formData.get("profileRole"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const msg =
      flat.fieldErrors.firstName?.[0] ??
      flat.fieldErrors.lastName?.[0] ??
      flat.fieldErrors.companyName?.[0] ??
      flat.fieldErrors.profileRole?.[0] ??
      flat.fieldErrors.website?.[0] ??
      flat.fieldErrors.password?.[0] ??
      flat.fieldErrors.confirmPassword?.[0] ??
      flat.fieldErrors.email?.[0] ??
      "Vérifiez les champs.";
    return { ok: false, message: msg };
  }

  const websiteNorm = tryNormalizeWebsiteForOrgKey(parsed.data.website);
  if (!websiteNorm.ok) {
    const hint =
      websiteNorm.error === "EMPTY"
        ? "Indiquez le site web de votre entreprise."
        : "Site web invalide. Exemple : monentreprise.fr ou https://www.monentreprise.fr";
    return { ok: false, message: hint };
  }

  const reachable = await verifyWebsiteReachable(websiteNorm.value);
  if (!reachable.ok) {
    return {
      ok: false,
      message:
        "Nous n'avons pas pu joindre ce site web. Vérifiez l'adresse ou réessayez plus tard.",
    };
  }

  const deps = getApplicationDeps();
  const passwordHash = await hashPassword(parsed.data.password);
  const reg = await deps.registration.registerNewUser({
    email: parsed.data.email,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    companyName: parsed.data.companyName,
    profileRole: parsed.data.profileRole,
    passwordHash,
    signupWebsiteNormalized: websiteNorm.value,
  });

  if (!reg.ok) {
    if (reg.error === "WEBSITE_TAKEN") {
      return {
        ok: false,
        message:
          "Une organisation est déjà enregistrée avec ce site web. Connectez-vous ou contactez votre administrateur.",
      };
    }
    return {
      ok: false,
      message: "Un compte existe déjà avec cet e-mail.",
    };
  }

  const raw = generateOpaqueToken();
  await deps.session.createSessionRecord({
    userId: reg.userId,
    rawToken: raw,
    userAgent: null,
  });
  await setSessionCookie(raw);

  redirect("/onboarding");
}
