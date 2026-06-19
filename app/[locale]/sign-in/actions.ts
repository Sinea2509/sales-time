"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getApplicationDeps } from "@/lib/application-deps";
import { generateOpaqueToken } from "@/lib/auth/tokens";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { verifyPassword } from "@/lib/auth/password";

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Adresse e-mail requise.")
    .email("Adresse e-mail invalide.")
    .transform((e) => e.toLowerCase()),
  password: z
    .string()
    .min(1, "Mot de passe requis.")
    .max(200, "Mot de passe trop long."),
  next: z.string().max(2000).optional().nullable(),
});

export type SignInFieldErrors = Partial<
  Record<"email" | "password", string>
>;

export type SignInState =
  | { ok: false; message: string; fieldErrors?: SignInFieldErrors }
  | null;

function validationError(flat: {
  fieldErrors: {
    email?: string[];
    password?: string[];
  };
}) {
  const fieldErrors: SignInFieldErrors = {};
  const emailMsg = flat.fieldErrors.email?.[0];
  const passwordMsg = flat.fieldErrors.password?.[0];
  if (emailMsg) {
    fieldErrors.email = emailMsg;
  }
  if (passwordMsg) {
    fieldErrors.password = passwordMsg;
  }
  const message =
    emailMsg ?? passwordMsg ?? "E-mail ou mot de passe invalide.";
  return { ok: false as const, message, fieldErrors };
}

export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });
  if (!parsed.success) {
    return validationError(parsed.error.flatten());
  }

  const deps = getApplicationDeps();
  const user = await deps.signInRead.findUserForPasswordSignIn(
    parsed.data.email,
  );
  if (!user) {
    return { ok: false, message: "E-mail ou mot de passe incorrect." };
  }
  if (user.status === "DISABLED") {
    return {
      ok: false,
      message: "Ce compte est désactivé. Contactez un administrateur.",
    };
  }
  const ok = await verifyPassword(user.passwordHash, parsed.data.password);
  if (!ok) {
    return { ok: false, message: "E-mail ou mot de passe incorrect." };
  }

  const raw = generateOpaqueToken();
  await deps.session.createSessionRecord({
    userId: user.id,
    rawToken: raw,
    userAgent: null,
  });
  await setSessionCookie(raw);

  const next = parsed.data.next?.trim();
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    redirect(next);
  }

  const hasNoOrg = user.organizationMembershipCount === 0;
  if (user.isSuperAdmin && hasNoOrg) {
    redirect("/admin");
  }
  redirect("/company");
}
