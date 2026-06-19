import { redirect } from "next/navigation";
import { AccountProfileForm } from "@/components/organisms/account-profile-form";
import { getApplicationDeps } from "@/lib/application-deps";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    redirect("/sign-in");
  }

  const profile = await deps.users.findAccountProfileByUserId(principal.userId);
  if (!profile) {
    redirect("/sign-in");
  }

  return <AccountProfileForm profile={profile} />;
}
