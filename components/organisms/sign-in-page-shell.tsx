import Link from "next/link";
import { SignInForm } from "@/components/organisms/sign-in-form";
import { NavLinkButton } from "@/components/molecules/nav-link-button";
import { SignInBrandPanel } from "@/components/molecules/sign-in-brand-panel";
import { SalesTimeLogoMark } from "@/components/atoms/sales-time-logo-mark";
import { pageTitleClass } from "@/lib/page-typography";

type SignInPageShellProps = {
  next?: string;
  reason?: string;
};

export function SignInPageShell({ next, reason }: SignInPageShellProps) {
  const showVersionNotice = reason === "new_version";
  return (
    <main className="grid h-svh max-h-svh min-h-svh grid-cols-1 overflow-hidden bg-card lg:grid-cols-2">
      <SignInBrandPanel />

      <section className="flex min-h-0 h-full items-center justify-center overflow-y-auto px-6 py-10 sm:px-10">
        <div className="w-full max-w-md space-y-6">
          <header className="space-y-1">
            <Link
              href="/"
              className="mb-5 flex items-center gap-2.25 lg:hidden"
            >
              <SalesTimeLogoMark size="sm" />
              <span className="text-[15px] font-bold tracking-tight text-foreground">
                Sales Time
              </span>
            </Link>
            <h1 className={pageTitleClass}>Connexion</h1>
            <p className="text-muted-foreground text-sm">
              Accédez à votre espace Sales Time.
            </p>
            {showVersionNotice ? (
              <p className="text-muted-foreground text-sm" role="status">
                Une nouvelle version est disponible. Reconnectez-vous pour
                continuer.
              </p>
            ) : null}
          </header>

          <SignInForm next={next} />

          <div className="flex flex-col gap-2 text-sm">
            <NavLinkButton
              href="/forgot-password"
              variant="link"
              className="text-muted-foreground hover:text-foreground h-auto p-0 underline-offset-4"
            >
              Mot de passe oublié ?
            </NavLinkButton>
            <p className="text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link
                href="/sign-up"
                className="font-medium text-brand hover:underline"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
