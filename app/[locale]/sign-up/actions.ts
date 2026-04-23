"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { createSessionRecord } from "@/lib/auth/session-db";
import { generateOpaqueToken } from "@/lib/auth/tokens";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { tryNormalizeWebsiteForOrgKey } from "@/lib/website/normalize-website";
import { prisma } from "@/lib/prisma";

const schema = z
  .object({
    email: z.string().trim().email().transform((e) => e.toLowerCase()),
    website: z.string().trim().min(1, "Le site web est requis.").max(500),
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
    email: formData.get("email"),
    website: formData.get("website"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const msg =
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

  const existingOrg = await prisma.organization.findUnique({
    where: { websiteNormalized: websiteNorm.value },
  });
  if (existingOrg) {
    return {
      ok: false,
      message:
        "Une organisation est déjà enregistrée avec ce site web. Connectez-vous ou contactez votre administrateur.",
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return {
      ok: false,
      message: "Un compte existe déjà avec cet e-mail.",
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      signupWebsiteNormalized: websiteNorm.value,
    },
  });

  const raw = generateOpaqueToken();
  await createSessionRecord({
    userId: user.id,
    rawToken: raw,
    userAgent: null,
  });
  await setSessionCookie(raw);

  redirect("/register/profile");
}
