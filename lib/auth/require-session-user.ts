import { redirect } from "next/navigation";
import { getApplicationDeps } from "@/lib/application-deps";

/** Redirects to `/sign-in` when there is no valid session. */
export async function requireSessionUserId(): Promise<string> {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    redirect("/sign-in");
  }
  return principal.userId;
}
