import Link from "next/link";
import { getApplicationDeps } from "@/lib/application-deps";
import { pageTitleClass } from "@/lib/page-typography";
import { AcceptSuperAdminInvitationClient } from "@/components/organisms/accept-super-admin-invitation-client";

type Props = { params: Promise<{ token: string }> };

export default async function SuperAdminInvitationPage({ params }: Props) {
  const { token } = await params;
  const deps = getApplicationDeps();
  const inv =
    await deps.superAdminInvitations.findPendingByTokenForPreview(token);

  if (!inv) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <p className="text-muted-foreground text-center text-sm">
          Ce lien d&apos;invitation super administrateur est invalide ou a
          expiré.
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
        <h1 className={pageTitleClass}>Invitation super administrateur</h1>
        <p className="text-muted-foreground text-sm">
          Vous êtes invité à recevoir les droits{" "}
          <span className="font-medium text-foreground">
            super administrateur
          </span>{" "}
          sur Sales Time (espace <span className="font-mono">/admin</span>) pour
          l&apos;adresse{" "}
          <span className="font-mono text-foreground">{inv.email}</span>.
        </p>
        <p className="text-muted-foreground text-xs">
          Vous devez disposer d&apos;un compte avec cette adresse e-mail. Si ce
          n&apos;est pas encore le cas, créez un compte puis revenez sur ce
          lien.
        </p>
        {principal ? (
          principal.email.toLowerCase() === inv.email.toLowerCase() ? (
            <AcceptSuperAdminInvitationClient token={token} />
          ) : (
            <p className="text-destructive text-sm">
              Connecté en tant que {principal.email}. Déconnectez-vous et
              connectez-vous avec {inv.email} pour accepter.
            </p>
          )
        ) : (
          <p className="text-muted-foreground text-sm">
            <Link
              href={`/sign-in?next=/super-admin-invitations/${encodeURIComponent(token)}`}
              className="text-primary underline"
            >
              Connectez-vous
            </Link>{" "}
            avec {inv.email} pour accepter l&apos;invitation.
          </p>
        )}
      </div>
    </div>
  );
}
