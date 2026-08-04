import Link from "next/link";
import { redirect } from "next/navigation";
import { getApplicationDeps } from "@/lib/application-deps";
import { pageTitleClass } from "@/lib/page-typography";
import { JoinInvitationForm } from "@/components/organisms/join-invitation-form";
import { organizationMembershipRoleLabel } from "@/src/core/domain/organization-membership-role";

type Props = { params: Promise<{ token: string }> };

export default async function JoinInvitationPage({ params }: Props) {
  const { token } = await params;
  const deps = getApplicationDeps();
  const inv =
    await deps.organizationInvitations.findPendingByTokenForPreview(token);

  if (!inv) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <p className="text-muted-foreground text-center text-sm">
          Ce lien d&apos;invitation est invalide ou a expiré.
        </p>
        <Link href="/sign-in" className="mt-4 text-primary underline">
          Connexion
        </Link>
      </div>
    );
  }

  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (principal) {
    if (principal.email.toLowerCase() === inv.email.toLowerCase()) {
      redirect(`/invitations/${encodeURIComponent(token)}`);
    }
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-4 rounded-xl border border-border p-8 text-center shadow-sm">
          <h1 className={pageTitleClass}>Autre compte connecté</h1>
          <p className="text-muted-foreground text-sm">
            Vous êtes connecté en tant que{" "}
            <span className="font-mono text-foreground">{principal.email}</span>
            . Déconnectez-vous pour créer le compte associé à{" "}
            <span className="font-mono text-foreground">{inv.email}</span>.
          </p>
          <form action="/sign-out" method="POST" className="pt-1">
            <button
              type="submit"
              className="text-primary text-sm font-medium underline"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-2 rounded-xl border border-border p-8 text-center shadow-sm">
        <h1 className={pageTitleClass}>Créer votre compte</h1>
        <p className="text-muted-foreground text-sm">
          Rejoignez{" "}
          <span className="font-medium text-foreground">
            {inv.organizationName}
          </span>{" "}
          en tant que{" "}
          <span className="font-medium text-foreground">
            {organizationMembershipRoleLabel(inv.role).toLowerCase()}
          </span>
          .
        </p>
        <JoinInvitationForm token={token} inviteEmail={inv.email} />
      </div>
    </div>
  );
}
