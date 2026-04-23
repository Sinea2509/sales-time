"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSessionRecord } from "@/lib/auth/session-db";
import { generateOpaqueToken } from "@/lib/auth/tokens";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().trim().email().transform((e) => e.toLowerCase()),
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

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user) {
    return { ok: false, message: "E-mail ou mot de passe incorrect." };
  }
  const ok = await verifyPassword(user.passwordHash, parsed.data.password);
  if (!ok) {
    return { ok: false, message: "E-mail ou mot de passe incorrect." };
  }

  const raw = generateOpaqueToken();
  await createSessionRecord({
    userId: user.id,
    rawToken: raw,
    userAgent: null,
  });
  await setSessionCookie(raw);

  const next = parsed.data.next?.trim();
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    redirect(next);
  }
  redirect("/company");
}
