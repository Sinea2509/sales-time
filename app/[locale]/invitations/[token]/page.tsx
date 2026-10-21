// cspell:words expiree
import Link from "next/link";
import { getApplicationDeps } from "@/lib/application-deps";
import { pageTitleClass } from "@/lib/page-typography";
import { Visual3d } from "@/components/atoms/visual-3d";
import {
  InvitationPageShell,
  type InvitationPageMode,
} from "@/components/organisms/invitation-page-shell";
import { organizationMembershipRoleLabel } from "@/src/core/domain/organization-membership-role";

type Props = { params: Promise<{ token: string }> };

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
          <Visual3d name="c6-invitation-expiree" width={240} height={180} />
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
  const mode: InvitationPageMode = principal
    ? principal.email.toLowerCase() === inv.email.toLowerCase()
      ? { kind: "accept" }
      : { kind: "otherAccount", principalEmail: principal.email }
    : inv.accountExists
      ? { kind: "signIn" }
      : { kind: "join" };

  return (
    <InvitationPageShell
      token={token}
      organizationName={inv.organizationName}
      roleLabel={organizationMembershipRoleLabel(inv.role).toLowerCase()}
      inviterName={inv.inviterName?.trim() || null}
      email={inv.email}
      expiresAtLabel={inv.expiresAt ? frenchDate(inv.expiresAt) : null}
      mode={mode}
    />
  );
}
