import { redirect } from "next/navigation";
import { makeApplicationDeps } from "@/src/adapters/composition";

/** Redirects to `/sign-in` when there is no valid session. */
export async function requireSessionUserId(): Promise<string> {
  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    redirect("/sign-in");
  }
  return principal.userId;
}
