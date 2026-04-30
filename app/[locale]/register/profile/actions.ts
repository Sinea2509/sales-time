"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getApplicationDeps } from "@/lib/application-deps";
import type { UserProfileRole } from "@/src/core/domain/user-profile-role";

const profileRoleSchema = z.enum([
  "COMMERCIAL",
  "SALES_MANAGER",
  "LEADERSHIP",
  "OTHER",
]);

const schema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis").max(80),
  lastName: z.string().trim().min(1, "Le nom est requis").max(80),
  profileRole: profileRoleSchema,
});

export type CompleteRegisterProfileResult =
  | { ok: true }
  | { ok: false; message: string };

export async function completeRegisterProfile(
  _prev: CompleteRegisterProfileResult | undefined,
  formData: FormData,
): Promise<CompleteRegisterProfileResult> {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    return { ok: false, message: "Session expirée." };
  }

  const parsed = schema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    profileRole: formData.get("profileRole"),
  });

  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors.firstName?.[0];
    const last = parsed.error.flatten().fieldErrors.lastName?.[0];
    const role = parsed.error.flatten().fieldErrors.profileRole?.[0];
    return {
      ok: false,
      message: first ?? last ?? role ?? "Vérifiez les champs.",
    };
  }

  const user = await deps.users.findRegisterGateByUserId(principal.userId);

  if (!user) {
    return { ok: false, message: "Utilisateur introuvable." };
  }

  if (user.registerProfileCompletedAt != null) {
    redirect("/onboarding");
  }

  const { firstName, lastName, profileRole } = parsed.data;

  await deps.users.completeRegisterProfile({
    userId: user.id,
    firstName,
    lastName,
    profileRole: profileRole as UserProfileRole,
  });

  redirect("/onboarding");
}
