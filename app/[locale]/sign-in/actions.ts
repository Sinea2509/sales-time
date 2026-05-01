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
    .email()
    .transform((e) => e.toLowerCase()),
  password: z.string().min(1).max(200),
  next: z.string().max(2000).optional().nullable(),
});

export type SignInState = { ok: false; message: string } | null;

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
    return { ok: false, message: "E-mail ou mot de passe invalide." };
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
