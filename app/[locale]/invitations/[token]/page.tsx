import Link from "next/link";
import { getApplicationDeps } from "@/lib/application-deps";
import { pageTitleClass } from "@/lib/page-typography";
import { AcceptInvitationClient } from "@/components/organisms/accept-invitation-client";
import { JoinInvitationForm } from "@/components/organisms/join-invitation-form";
import { organizationMembershipRoleLabel } from "@/src/core/domain/organization-membership-role";

type Props = { params: Promise<{ token: string }> };

const buttonLinkClass =
  "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium";

function frenchDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

/**
 * La page où arrive un invité.
 *
 * Elle montre directement le bon chemin : le formulaire d'inscription quand
 * l'adresse n'a pas encore de compte, un bouton « Se connecter » sinon. Avant
 * le 20 octobre 2026, elle proposait deux petits liens, puis une seconde page
 * de formulaire, et un invité a fini par chercher « le mot de passe à
 * activer » dans « mot de passe oublié ».
 */
export default async function InvitationPage({ params }: Props) {
  const { token } = await params;
  const deps = getApplicationDeps();
  const inv =
    await deps.organizationInvitations.findPendingByTokenForPreview(token);

  if (!inv) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-3 rounded-xl border border-border p-8 text-center shadow-sm">
          <h1 className={pageTitleClass}>Invitation expirée</h1>
          <p className="text-muted-foreground text-sm">
            Ce lien d&apos;invitation n&apos;est plus valable : il a expiré, a
            déjà servi, ou a été remplacé par une nouvelle invitation. Demandez
            à la personne qui vous a invité de vous la renvoyer.
          </p>
          <Link href="/sign-in" className="text-primary text-sm underline">
            J&apos;ai déjà un compte : me connecter
          </Link>
        </div>
      </div>
    );
  }

  const principal = await deps.auth.getAuthenticatedPrincipal();
  const role = organizationMembershipRoleLabel(inv.role).toLowerCase();
  const inviter = inv.inviterName?.trim();
  const signInHref = `/sign-in?next=/invitations/${encodeURIComponent(token)}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className={pageTitleClass}>
            Rejoignez {inv.organizationName} sur Sales Time
          </h1>
          <p className="text-muted-foreground text-sm">
            {inviter ? (
              <>
                <span className="font-medium text-foreground">{inviter}</span>{" "}
                vous invite
              </>
            ) : (
              "Vous êtes invité"
            )}{" "}
            en tant que{" "}
            <span className="font-medium text-foreground">{role}</span>. Sales
            Time analyse vos rendez-vous et vous dit où progresser.
          </p>
        </div>

        {principal ? (
          principal.email.toLowerCase() === inv.email.toLowerCase() ? (
            <AcceptInvitationClient token={token} />
          ) : (
            <div className="space-y-3 text-center text-sm">
              <p className="text-muted-foreground">
                Vous êtes connecté avec{" "}
                <span className="font-mono text-foreground">
                  {principal.email}
                </span>
                , mais l&apos;invitation est pour{" "}
                <span className="font-mono text-foreground">{inv.email}</span>.
              </p>
              <form action="/sign-out" method="POST">
                <button
                  type="submit"
                  className="text-primary font-medium underline"
                >
                  Me déconnecter pour continuer
                </button>
              </form>
            </div>
          )
        ) : inv.accountExists ? (
          <div className="space-y-3 text-center text-sm">
            <p className="text-muted-foreground">
              Vous avez déjà un compte Sales Time avec{" "}
              <span className="font-mono text-foreground">{inv.email}</span>.
              Connectez-vous pour rejoindre l&apos;équipe.
            </p>
            <Link href={signInHref} className={buttonLinkClass}>
              Me connecter et rejoindre {inv.organizationName}
            </Link>
            <Link
              href="/forgot-password"
              className="text-muted-foreground block text-xs underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        ) : (
          <JoinInvitationForm
            token={token}
            inviteEmail={inv.email}
            organizationName={inv.organizationName}
          />
        )}

        {inv.expiresAt ? (
          <p className="text-muted-foreground text-center text-xs">
            Invitation valable jusqu&apos;au {frenchDate(inv.expiresAt)}.
          </p>
        ) : null}
      </div>
    </div>
  );
}
