"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { getApplicationDeps } from "@/lib/application-deps";

const passwordSchema = z
  .object({
    token: z.string().min(10).max(500),
    password: z.string().min(8).max(200),
    confirm: z.string().max(200),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirm"],
  });

export type ResetPasswordState = { ok: false; message: string } | null;

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = passwordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors.password?.[0] ??
      parsed.error.flatten().fieldErrors.confirm?.[0] ??
      "Données invalides.";
    return { ok: false, message: msg };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const deps = getApplicationDeps();
  const result = await deps.passwordReset.resetPasswordWithToken({
    rawToken: parsed.data.token,
    passwordHash,
  });

  if (!result.ok) {
    return {
      ok: false,
      message: "Ce lien est invalide ou expiré. Demandez un nouveau lien.",
    };
  }

  redirect("/sign-in");
}
