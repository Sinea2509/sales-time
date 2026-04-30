"use server";

import { redirect } from "next/navigation";
import { setActiveOrganizationCookie } from "@/lib/auth/session-cookie";
import { getApplicationDeps } from "@/lib/application-deps";
import { runAcceptOrganizationInvitation } from "@/src/core/application/accept-organization-invitation";

export type AcceptInviteResult =
  | { ok: true }
  | {
      ok: false;
      error: "UNAUTHENTICATED" | "INVALID" | "EMAIL_MISMATCH" | "EXPIRED";
    };

export async function acceptOrganizationInvitationAction(
  token: string,
): Promise<AcceptInviteResult> {
  const deps = getApplicationDeps();
  const result = await runAcceptOrganizationInvitation(deps, token);
  if (!result.ok) {
    return result;
  }

  await setActiveOrganizationCookie(result.organizationId);
  redirect("/company");
}
