import Link from "next/link";
import { getApplicationDeps } from "@/lib/application-deps";
import { pageTitleClass } from "@/lib/page-typography";
import { AcceptInvitationClient } from "@/components/organisms/accept-invitation-client";
import { organizationMembershipRoleLabel } from "@/src/core/domain/organization-membership-role";

type Props = { params: Promise<{ token: string }> };

export default async function InvitationPage({ params }: Props) {
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border p-8 text-center shadow-sm">
        <h1 className={pageTitleClass}>Invitation · {inv.organizationName}</h1>
        <p className="text-muted-foreground text-sm">
          Vous avez été invité en tant que{" "}
          <span className="font-medium text-foreground">
            {organizationMembershipRoleLabel(inv.role).toLowerCase()}
          </span>{" "}
          pour l&apos;adresse{" "}
          <span className="font-mono text-foreground">{inv.email}</span>.
        </p>
        {principal ? (
          principal.email.toLowerCase() === inv.email.toLowerCase() ? (
            <AcceptInvitationClient token={token} />
          ) : (
            <p className="text-destructive text-sm">
              Connecté en tant que {principal.email}. Déconnectez-vous et
              connectez-vous avec {inv.email} pour accepter.
            </p>
          )
        ) : (
          <div className="text-muted-foreground space-y-3 text-sm">
            <p>
              <Link
                href={`/sign-in?next=/invitations/${encodeURIComponent(token)}`}
                className="text-primary underline"
              >
                Connectez-vous
              </Link>{" "}
              avec {inv.email} pour rejoindre l&apos;organisation.
            </p>
            <p>
              <Link
                href={`/invitations/${encodeURIComponent(token)}/join`}
                className="text-primary font-medium underline"
              >
                Créer un compte
              </Link>{" "}
              (inscription sans parcours d&apos;onboarding : vous rejoignez
              directement l&apos;équipe).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
