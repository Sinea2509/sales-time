import { redirect } from "next/navigation";
import { AccountActionsPanel } from "@/components/organisms/account-actions-panel";
import { getApplicationDeps } from "@/lib/application-deps";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    redirect("/sign-in");
  }

  return <AccountActionsPanel email={principal.email} />;
}
