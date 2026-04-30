"use server";

import { redirect } from "next/navigation";
import { getApplicationDeps } from "@/lib/application-deps";
import { runAcceptSuperAdminInvitation } from "@/src/core/application/accept-super-admin-invitation";

export type AcceptSuperAdminInviteResult =
  | { ok: true }
  | {
      ok: false;
      error: "UNAUTHENTICATED" | "INVALID" | "EMAIL_MISMATCH" | "EXPIRED";
    };

export async function acceptSuperAdminInvitationAction(
  token: string,
): Promise<AcceptSuperAdminInviteResult> {
  const deps = getApplicationDeps();
  const result = await runAcceptSuperAdminInvitation(deps, token);
  if (!result.ok) {
    return result;
  }

  redirect("/admin");
}
