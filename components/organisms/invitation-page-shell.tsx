import Link from "next/link";
import { FileAudio, Gauge, MessageSquareQuote } from "lucide-react";
import { SalesTimeLogoMark } from "@/components/atoms/sales-time-logo-mark";
import { BrandCtaLink } from "@/components/molecules/brand-cta-link";
import {
  OnboardingBrandPanel,
  OnboardingBrandPoint,
} from "@/components/molecules/onboarding-brand-panel";
import { AcceptInvitationClient } from "@/components/organisms/accept-invitation-client";
import { JoinInvitationForm } from "@/components/organisms/join-invitation-form";
import { pageTitleClass } from "@/lib/page-typography";

export type InvitationPageMode =
  /** Pas encore de compte : le formulaire d'inscription. */
  | { kind: "join" }
  /** Un compte existe pour l'adresse invitée : se connecter. */
  | { kind: "signIn" }
  /** Connecté avec la bonne adresse : rejoindre en un clic. */
  | { kind: "accept" }
  /** Connecté avec une autre adresse. */
  | { kind: "otherAccount"; principalEmail: string };

type Props = {
  token: string;
  organizationName: string;
  roleLabel: string;
  inviterName: string | null;
  email: string;
  expiresAtLabel: string | null;
  mode: InvitationPageMode;
};

/**
 * La page où arrive un invité : à gauche, qui l'invite et ce que Sales Time
 * va lui apporter ; à droite, la seule chose à faire pour entrer.
 */
export function InvitationPageShell({
  token,
  organizationName,
  roleLabel,
  inviterName,
  email,
  expiresAtLabel,
  mode,
}: Props) {
  const signInHref = `/sign-in?next=/invitations/${encodeURIComponent(token)}`;

  return (
    <main className="grid min-h-svh grid-cols-1 bg-card lg:h-svh lg:grid-cols-2 lg:overflow-hidden">
      <OnboardingBrandPanel
        eyebrow="Invitation"
        title={
          inviterName ? (
            <>
              {inviterName} vous invite à rejoindre{" "}
              <span className="text-[#C4B8FF]">{organizationName}</span>
            </>
          ) : (
            <>
              Rejoignez{" "}
              <span className="text-[#C4B8FF]">{organizationName}</span> sur
              Sales Time
            </>
          )
        }
      >
        <div className="mt-2 space-y-5">
          <OnboardingBrandPoint
            icon={<FileAudio className="size-4.5" />}
            title="Vos rendez-vous analysés"
            text="Déposez un transcript Teams, Zoom, Meet ou un enregistrement audio."
          />
          <OnboardingBrandPoint
            icon={<Gauge className="size-4.5" />}
            title="Une note claire sur 100"
            text="Critère par critère, avec ce qui vous a fait gagner ou perdre des points."
          />
          <OnboardingBrandPoint
            icon={<MessageSquareQuote className="size-4.5" />}
            title="Un coaching personnel"
            text="Ce qu'attend votre prospect, et la phrase à dire au prochain rendez-vous."
          />
        </div>
      </OnboardingBrandPanel>

      <section className="flex min-h-0 items-center justify-center overflow-y-auto px-6 py-10 sm:px-10">
        <div className="w-full max-w-md space-y-7">
          <header className="space-y-2">
            <div className="mb-6 flex items-center gap-2.25 lg:hidden">
              <SalesTimeLogoMark size="sm" />
              <span className="text-[15px] font-bold tracking-tight text-foreground">
                Sales Time
              </span>
            </div>
            <p className="text-brand text-xs font-semibold tracking-[0.14em] uppercase">
              Invitation · {organizationName}
            </p>
            <h1 className={pageTitleClass}>
              {mode.kind === "join"
                ? "Créez votre compte"
                : mode.kind === "signIn"
                  ? "Connectez-vous pour rejoindre l'équipe"
                  : "Rejoignez l'équipe"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {inviterName ? `${inviterName} vous invite` : "Vous êtes invité"}{" "}
              en tant que{" "}
              <span className="font-medium text-foreground">{roleLabel}</span>.
              {mode.kind === "join"
                ? " Une minute suffit : vous choisissez votre mot de passe ici."
                : null}
            </p>
          </header>

          {mode.kind === "join" ? (
            <JoinInvitationForm
              token={token}
              inviteEmail={email}
              organizationName={organizationName}
            />
          ) : mode.kind === "signIn" ? (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Vous avez déjà un compte Sales Time avec{" "}
                <span className="font-mono text-foreground">{email}</span>.
              </p>
              <BrandCtaLink href={signInHref} size="md" className="w-full">
                Me connecter et rejoindre {organizationName}
              </BrandCtaLink>
              <Link
                href="/forgot-password"
                className="text-muted-foreground block text-center text-xs underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          ) : mode.kind === "accept" ? (
            <AcceptInvitationClient token={token} />
          ) : (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Vous êtes connecté avec{" "}
                <span className="font-mono text-foreground">
                  {mode.principalEmail}
                </span>
                , mais l&apos;invitation est pour{" "}
                <span className="font-mono text-foreground">{email}</span>.
              </p>
              <form action="/sign-out" method="POST">
                <button
                  type="submit"
                  className="text-brand font-medium underline"
                >
                  Me déconnecter pour continuer
                </button>
              </form>
            </div>
          )}

          {expiresAtLabel ? (
            <p className="text-muted-foreground border-t border-border pt-4 text-center text-xs">
              Invitation valable jusqu&apos;au {expiresAtLabel}.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
